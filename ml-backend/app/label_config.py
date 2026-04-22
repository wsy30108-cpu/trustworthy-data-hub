"""Parse Label Studio `label_config` XML into a structured description.

Label Studio sends the project's XML labeling config along with every
`/predict` request.  We parse the tags we understand so we can produce
predictions that match the project schema exactly.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from xml.etree import ElementTree as ET


# Tags that carry labels / choices the model can assign.
CONTROL_TAGS = {
    "Choices": "choices",
    "Labels": "labels",
    "RectangleLabels": "rectanglelabels",
    "PolygonLabels": "polygonlabels",
    "KeyPointLabels": "keypointlabels",
    "EllipseLabels": "ellipselabels",
    "BrushLabels": "brushlabels",
    "TextArea": "textarea",
    "Rating": "rating",
}

# Tags that represent the object being labeled.
OBJECT_TAGS = {"Text", "HyperText", "Image", "Audio", "Video", "Paragraphs"}


@dataclass
class ControlTag:
    """One labeling control parsed from the project XML."""

    tag: str                # e.g. "Choices" / "Labels" / "RectangleLabels"
    type: str               # LS result type string, e.g. "choices"
    name: str               # from_name
    to_name: str            # to_name (the object tag referenced)
    labels: List[str] = field(default_factory=list)
    choice: Optional[str] = None   # "single" / "multiple" for Choices


@dataclass
class ObjectTag:
    tag: str                # "Text" / "Image" / ...
    name: str
    value_key: str          # "$text" -> "text"


@dataclass
class ParsedConfig:
    controls: List[ControlTag] = field(default_factory=list)
    objects: Dict[str, ObjectTag] = field(default_factory=dict)

    def controls_for(self, to_name: str) -> List[ControlTag]:
        return [c for c in self.controls if c.to_name == to_name]


def parse_label_config(xml: Optional[str]) -> ParsedConfig:
    """Best-effort XML parse; returns an empty config if missing / malformed."""

    cfg = ParsedConfig()
    if not xml:
        return cfg

    try:
        root = ET.fromstring(xml)
    except ET.ParseError:
        return cfg

    # Walk every element; LS XML is flat/shallow so recursion is fine.
    for elem in root.iter():
        tag = elem.tag

        if tag in OBJECT_TAGS:
            name = elem.attrib.get("name")
            value = elem.attrib.get("value", "")
            if name:
                cfg.objects[name] = ObjectTag(
                    tag=tag,
                    name=name,
                    value_key=value.lstrip("$"),
                )
            continue

        if tag in CONTROL_TAGS:
            name = elem.attrib.get("name")
            to_name = elem.attrib.get("toName")
            if not name or not to_name:
                continue
            control = ControlTag(
                tag=tag,
                type=CONTROL_TAGS[tag],
                name=name,
                to_name=to_name,
                choice=elem.attrib.get("choice"),
            )
            # Nested <Choice> or <Label> children.
            for child in elem:
                if child.tag in {"Choice", "Label"}:
                    value = child.attrib.get("value")
                    if value:
                        control.labels.append(value)
            cfg.controls.append(control)

    return cfg
