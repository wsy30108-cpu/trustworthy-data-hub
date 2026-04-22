# Label Studio Sample Files

These files are laid out to match Label Studio's official import formats.
See https://labelstud.io/guide/tasks for the authoritative reference.

## text/
| File | Usage in Label Studio |
| --- | --- |
| `sample.txt`       | Upload under **Project → Import**. Enable *Treat each file as one task*. |
| `articles.txt`     | Same upload path; LS creates one task per non-empty line. |
| `tasks.json`       | Native LS JSON array import. Each entry already has `data`. |
| `tasks.jsonl`      | JSON-Lines variant of `tasks.json`. |
| `tasks.csv`        | LS reads header row as keys: `text`, `language`, `topic`. |
| `tasks.tsv`        | Tab-separated variant. |
| `image_tasks.json` | JSON referencing public image URLs; import into an image-labeling project. |

Suggested labeling config for the text tasks:

```xml
<View>
  <Text name="txt" value="$text"/>
  <Choices name="sentiment" toName="txt" choice="single">
    <Choice value="Positive"/><Choice value="Neutral"/><Choice value="Negative"/>
  </Choices>
  <Labels name="ner" toName="txt">
    <Label value="EMAIL"/><Label value="URL"/><Label value="PHONE"/>
  </Labels>
</View>
```

## images/
PNG + JPG files uploadable directly under **Project → Import** in an
image-labeling project. Use label config:

```xml
<View>
  <Image name="img" value="$image"/>
  <RectangleLabels name="rect" toName="img">
    <Label value="Object"/>
  </RectangleLabels>
</View>
```

## audio/
Drop `.wav`, `.mp3`, `.ogg` files into an audio project. Label config:

```xml
<View>
  <Audio name="audio" value="$audio"/>
  <Labels name="labels" toName="audio">
    <Label value="Speech"/><Label value="Noise"/>
  </Labels>
</View>
```

## video/
`.mp4` and `.webm` files for a video-labeling project:

```xml
<View>
  <Video name="video" value="$video"/>
  <VideoRectangle name="box" toName="video"/>
  <Labels name="labels" toName="video">
    <Label value="Person"/><Label value="Car"/>
  </Labels>
</View>
```
