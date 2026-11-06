# llama.pages

> [!NOTE]
> Work In Progress

Official website for llama.cpp.

## Model catalog

`src/lib/catalog.json` declares each size's `inputModalities`: `text`, `image`,
`audio`, or `video`. Add media inputs only after qualifying the listed builds
and their projectors. Image input does not imply video or synchronized audio
and video; audio input does not imply speech output.

The website renders these inputs. `/v1/catalog.json` publishes the same list
and derives `vision` from `image` for existing app releases. Keep that field
until the v1 API is retired; do not author a second capability flag.
