# Save and move a project

Download a `.sketchcast` file to keep a copy of your board, supported embedded
images, script, output format, and webcam layout. Import it into another
Sketchcast browser or device as a new local project. No account, provider key,
cloud sync, or upload is needed for these operations.

**Project files are unencrypted and do not include recordings.** Anyone who can
read the file can read its board and script. Download videos separately from
**Takes**. Keep copies outside browser storage before clearing site data.

## Download a project

1. Open Sketchcast's project home or the project you want to save.
2. Select **Download project**. Your browser downloads a file named
   `sketchcast-<project-name>.sketchcast`.
3. Keep the file in your chosen backup location. If you need the recordings,
   open **Takes** and download those too.

Downloading the active project includes its current board and script. It does
not require an AI provider or a cloud-sync connection.

## Import into another browser

1. Open `/studio` on the destination Sketchcast installation and wait for
   **Recovery Vault ready on this device**.
2. Select **Import project** and choose the `.sketchcast` file.
3. Review the project name, output format, element count, and script length.
4. Select **Import as new project**. The imported project opens in the studio.

Import creates a separate local project, even when a project with the same
name already exists. It preserves existing projects. The file is validated
before import; an invalid file leaves the import button disabled. Storage
failures are reported instead of a successful save.

The file picker also accepts `.json`, but the contents must use the version 1
Sketchcast format. Renaming an arbitrary JSON or Excalidraw file is not enough.

## Duplicate a project

On project home, select **Duplicate** beneath the project. Sketchcast opens a
new local project with `(copy)` appended to its name. The board, supported
images, script, output format, and webcam layout are copied. Recordings and sync
state remain with the original.

Duplication uses the same content validation and size limits as project files.
Element links and unsupported metadata are removed from the copy.

## Start with a teaching example

Select a card under **Skip the blank canvas** on project home:

| Starter | Editable example |
| --- | --- |
| Explain a process | A three-step path from an idea to a first draft |
| Compare two ideas | The different goals of practice and performance |
| Teach a concept | A thermostat feedback loop: observe, compare, adjust |

Each starter contains an original board and sample script, included under the
repository's [MIT license](../LICENSE). All three are free and need no provider
key. Opening a starter creates a separate project each time, so edits do not
change the example. Project and starter previews render the actual board;
an empty board shows **A fresh canvas**, and a failed render shows
**Preview unavailable**.

## Format and limits

The same validation applies to import, download, and duplication.

| Content | Support or limit |
| --- | --- |
| File | Version 1 JSON, `type: "sketchcast"`; maximum 10 MiB (10,485,760 bytes), including embedded image data |
| Name | 1–80 characters after trimming; no control characters |
| Script | Up to 100,000 characters |
| Board | Up to 5,000 elements: rectangles, diamonds, ellipses, text, lines, arrows, freehand strokes, images, and frames |
| Drawing paths | Up to 20,000 points per line, arrow, or freehand stroke, subject to the shared complexity budget |
| Images | Embedded base64 PNG, JPEG, WebP, or GIF; up to 500 image-file entries |
| Image dimensions | Each dimension at most 16,384 pixels; at most 40 megapixels across all referenced unique images |
| Image bytes | At most 6 MiB of base64-decoded image bytes across referenced unique files |
| Drawing geometry | Dimensions and point extents at most 16,384; coordinates within ±100,000; dense hatched fills share a bounded rendering-work allowance |
| Output format | Landscape `16:9`, portrait `9:16`, or square `1:1` |
| Webcam layout | Visibility, corner, and size; no camera stream or recording |

Image signatures and dimensions must match the declared raster format. Remote
image URLs, SVG images, web embeds, unsupported element types, and missing image
files are rejected. Large images may exceed the whole-file cap before reaching
the dimension limits.

Sketchcast rebuilds supported content from an allowed set of fields. It removes
element links, unknown metadata, deleted elements, unused images, and stale
element references. The result preserves supported content rather than every
possible Excalidraw field. Unsupported versions, unsafe object properties,
excessively nested structures, and out-of-range values produce an error.

The file excludes video takes, provider-key settings, recovery codes, cloud
identifiers, and account state. It does not remove private information you have
written into the board or script. Review the content before sharing a file.

For the exact format implementation, see [project-file.ts](../lib/project-file.ts).
For storage and provider boundaries, see the [security model](SECURITY-MODEL.md).
Local file operations do not make Sketchcast fully offline: loading the app
and generating no-key templates still require its Next.js server.
