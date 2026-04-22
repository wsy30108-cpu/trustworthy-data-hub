"""Pre-labeling model.

The engine is intentionally rule-based so the service runs with zero heavy
dependencies.  It is structured so that swapping in a real ML model (HF
transformers, YOLO, etc.) only requires replacing `_predict_for_control`.

Supported Label Studio control tags:
  * Choices           (text / image classification)
  * Labels            (NER / span labeling on text)
  * RectangleLabels   (image bounding boxes)
  * TextArea          (free-text suggestions, e.g. summaries)
  * Rating            (1..N rating)
"""

from __future__ import annotations

import hashlib
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

from .label_config import ControlTag, ObjectTag, ParsedConfig, parse_label_config
from .schemas import Prediction, PredictionResult


# --- Heuristic lexicon used for Choices / Labels on text ---------------------

SENTIMENT_LEXICON: Dict[str, List[str]] = {
    "Positive":  ["good", "great", "excellent", "love", "amazing", "happy",
                  "wonderful", "awesome", "perfect", "nice", "棒", "好", "喜欢",
                  "赞", "优秀", "完美"],
    "Negative":  ["bad", "terrible", "awful", "hate", "poor", "worst", "sad",
                  "angry", "broken", "糟", "差", "讨厌", "烂", "失望"],
    "Neutral":   ["ok", "okay", "fine", "average", "normal", "一般", "还行", "普通"],
}

INTENT_LEXICON: Dict[str, List[str]] = {
    "Question":  ["?", "？", "how", "why", "what", "when", "where", "who",
                  "怎么", "为什么", "哪里", "什么"],
    "Request":   ["please", "could you", "would you", "帮我", "请"],
    "Complaint": ["refund", "broken", "not working", "complain", "投诉", "退款"],
    "Greeting":  ["hello", "hi", "hey", "你好", "您好"],
}

# Token-patterns for NER-ish span labeling.
NER_PATTERNS: Dict[str, re.Pattern[str]] = {
    "EMAIL":    re.compile(r"[\w\.-]+@[\w\.-]+\.\w+"),
    "URL":      re.compile(r"https?://[^\s]+"),
    "PHONE":    re.compile(r"(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{4}"),
    "DATE":     re.compile(r"\b\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?\b"),
    "MONEY":    re.compile(r"(?:[\$¥€£]\s?\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s?(?:USD|CNY|RMB|元))"),
    "PERSON":   re.compile(r"\b(?:Mr|Mrs|Ms|Dr)\.?\s+[A-Z][a-z]+"),
    "ORG":      re.compile(r"\b[A-Z][A-Za-z&]+(?:\s+[A-Z][A-Za-z&]+){0,3}\s+(?:Inc|Ltd|LLC|Corp|Co\.|Company|Group)\b"),
    "LOCATION": re.compile(r"\b(?:New York|San Francisco|Beijing|Shanghai|London|Tokyo|Paris|Berlin)\b"),
}


def _pick_object_value(task: Dict[str, Any], obj: ObjectTag) -> str:
    data = task.get("data", {}) or {}
    raw = data.get(obj.value_key, "")
    if isinstance(raw, str):
        return raw
    return str(raw)


def _first_that_matches(text: str, lexicon: Dict[str, List[str]]) -> Tuple[str, float]:
    text_lc = text.lower()
    best_label, best_hits = None, 0
    for label, keywords in lexicon.items():
        hits = sum(1 for kw in keywords if kw.lower() in text_lc)
        if hits > best_hits:
            best_label, best_hits = label, hits
    if best_label is None:
        return "", 0.0
    score = min(0.5 + 0.1 * best_hits, 0.95)
    return best_label, round(score, 3)


def _fallback_choice(labels: List[str], seed: str) -> str:
    if not labels:
        return ""
    idx = int(hashlib.md5(seed.encode("utf-8")).hexdigest(), 16) % len(labels)
    return labels[idx]


class PreLabelingModel:
    """Pure-Python rule-based pre-labeling engine."""

    def __init__(self, model_version: str) -> None:
        self.model_version = model_version

    # ------------------------------------------------------------------ public
    def predict(
        self,
        tasks: List[Dict[str, Any]],
        label_config: Optional[str],
    ) -> List[Prediction]:
        cfg = parse_label_config(label_config)
        return [self._predict_task(task, cfg) for task in tasks]

    # ----------------------------------------------------------------- private
    def _predict_task(self, task: Dict[str, Any], cfg: ParsedConfig) -> Prediction:
        results: List[PredictionResult] = []
        task_scores: List[float] = []

        for control in cfg.controls:
            obj = cfg.objects.get(control.to_name)
            text_value = _pick_object_value(task, obj) if obj else ""
            for res, score in self._predict_for_control(control, obj, text_value):
                results.append(res)
                task_scores.append(score)

        avg_score = round(sum(task_scores) / len(task_scores), 3) if task_scores else 0.0
        return Prediction(
            model_version=self.model_version,
            score=avg_score,
            result=results,
        )

    def _predict_for_control(
        self,
        control: ControlTag,
        obj: Optional[ObjectTag],
        text: str,
    ) -> List[Tuple[PredictionResult, float]]:
        tag = control.tag

        if tag == "Choices":
            return self._predict_choices(control, text)

        if tag == "Labels":
            if obj and obj.tag in {"Text", "HyperText", "Paragraphs"}:
                return self._predict_text_ner(control, text)
            return []

        if tag == "RectangleLabels":
            return self._predict_rect_default(control)

        if tag == "TextArea":
            return self._predict_textarea(control, text)

        if tag == "Rating":
            return self._predict_rating(control, text)

        return []

    # ----- Choices (classification) -----------------------------------------
    def _predict_choices(
        self, control: ControlTag, text: str,
    ) -> List[Tuple[PredictionResult, float]]:
        labels = control.labels
        if not labels:
            return []

        chosen, score = "", 0.0
        if text:
            # Try intent first, then sentiment, then any keyword-in-label heuristic.
            cand, cand_score = _first_that_matches(text, INTENT_LEXICON)
            if cand and cand in labels:
                chosen, score = cand, cand_score
            else:
                cand, cand_score = _first_that_matches(text, SENTIMENT_LEXICON)
                if cand and cand in labels:
                    chosen, score = cand, cand_score

            if not chosen:
                for lbl in labels:
                    if lbl.lower() in text.lower():
                        chosen, score = lbl, 0.7
                        break

        if not chosen:
            chosen = _fallback_choice(labels, seed=text or control.name)
            score = 0.5

        result = PredictionResult(
            id=str(uuid.uuid4())[:8],
            from_name=control.name,
            to_name=control.to_name,
            type="choices",
            value={"choices": [chosen]},
            score=score,
        )
        return [(result, score)]

    # ----- Labels (NER span labeling) ---------------------------------------
    def _predict_text_ner(
        self, control: ControlTag, text: str,
    ) -> List[Tuple[PredictionResult, float]]:
        if not text:
            return []

        label_set = {lbl.upper(): lbl for lbl in control.labels}
        out: List[Tuple[PredictionResult, float]] = []

        for ner_tag, pattern in NER_PATTERNS.items():
            if ner_tag not in label_set:
                continue
            lbl = label_set[ner_tag]
            for m in pattern.finditer(text):
                start, end = m.span()
                if start == end:
                    continue
                result = PredictionResult(
                    id=str(uuid.uuid4())[:8],
                    from_name=control.name,
                    to_name=control.to_name,
                    type="labels",
                    value={
                        "start": start,
                        "end": end,
                        "text": m.group(0),
                        "labels": [lbl],
                    },
                    score=0.9,
                )
                out.append((result, 0.9))
        return out

    # ----- RectangleLabels (images) -----------------------------------------
    def _predict_rect_default(
        self, control: ControlTag,
    ) -> List[Tuple[PredictionResult, float]]:
        if not control.labels:
            return []
        lbl = control.labels[0]
        result = PredictionResult(
            id=str(uuid.uuid4())[:8],
            from_name=control.name,
            to_name=control.to_name,
            type="rectanglelabels",
            value={
                "x": 25,
                "y": 25,
                "width": 50,
                "height": 50,
                "rotation": 0,
                "rectanglelabels": [lbl],
            },
            score=0.4,
        )
        return [(result, 0.4)]

    # ----- TextArea ---------------------------------------------------------
    def _predict_textarea(
        self, control: ControlTag, text: str,
    ) -> List[Tuple[PredictionResult, float]]:
        suggestion = ""
        if text:
            snippet = text.strip().split("\n", 1)[0][:120]
            suggestion = f"Auto summary: {snippet}"
        else:
            suggestion = "Auto suggestion"
        result = PredictionResult(
            id=str(uuid.uuid4())[:8],
            from_name=control.name,
            to_name=control.to_name,
            type="textarea",
            value={"text": [suggestion]},
            score=0.6,
        )
        return [(result, 0.6)]

    # ----- Rating -----------------------------------------------------------
    def _predict_rating(
        self, control: ControlTag, text: str,
    ) -> List[Tuple[PredictionResult, float]]:
        sentiment, _ = _first_that_matches(text, SENTIMENT_LEXICON)
        rating = {"Positive": 5, "Neutral": 3, "Negative": 1}.get(sentiment, 3)
        result = PredictionResult(
            id=str(uuid.uuid4())[:8],
            from_name=control.name,
            to_name=control.to_name,
            type="rating",
            value={"rating": rating},
            score=0.6,
        )
        return [(result, 0.6)]
