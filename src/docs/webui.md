<!-- markdownlint-disable MD033 -->

# Web UI

llama.cpp ships a modern chat interface built right into `llama serve`, with support for multimodal input, MCPs and more.

## Getting started

Start the server with a model and open it in your browser:

```sh
llama serve -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0 -c 0
```

Then visit http://localhost:8080 to start chatting. If the server cannot bind to 8080, pass another port with `port --8081`.

A few launch tips:

- `-c 0` uses the model's full context window.
- Users can override parameters per conversation in the settings panel.
- To reach the WebUI from other devices on your network, add `--host 0.0.0.0` (e.g. serving a model remotely accessing WebUI on your laptop).

## Chatting

The chat interface streams responses in real time and renders rich output:

- **Markdown:** with tables, lists, and syntax-highlighted code blocks.
- **Math:** LaTeX expressions rendered with KaTeX.
- **Reasoning:** thinking models show their reasoning in a collapsible block, separate from the answer. You can toggle the visibility of this in settings.
- **HTML/JS preview:** generated web code can be rendered inline for immediate visualization.

<video src="https://huggingface.co/buckets/ggml-org/docs-media/resolve/llama-html.mp4" aria-label="Rich HTML output" controls></video>

## Attachments

Add files to the conversation with media dropdown or drag-and-drop:

- **Images/PDFs** for vision language models (JPEG, PNG, GIF, WebP, SVG, PDF)
- **Audio** MP3/WAV for models that accept audio input

The UI knows each model's capabilities and prevents sending e.g. an image to a text-only model.

<video src="https://huggingface.co/buckets/ggml-org/docs-media/resolve/llama-mm.mp4" aria-label="MM Input" controls></video>

## Managing conversations

- **Branching:** edit any earlier message or regenerate any response to fork the conversation at that point, navigate between branches freely, nothing is lost
- **Search:** find conversations by title or content
- **Import/Export:** back up or share conversations as JSON files

## Structured output

In the settings you can supply a custom JSON schema to constrain the model's responses, handy for tasks like invoice extraction or data parsing where you need machine-readable output every time.

In the WebUI: `Settings → Developer → Custom JSON`, and put your schema:

```json
{
	"json_schema": {
		"type": "object",
		"properties": {
			"sentiment": { "type": "string", "enum": ["positive", "neutral", "negative"] },
			"confidence": { "type": "number", "minimum": 0, "maximum": 1 },
			"summary": { "type": "string", "maxLength": 200 }
		},
		"required": ["sentiment", "confidence", "summary"]
	}
}
```

## Multiple models

When the server runs in [router mode](serve) (started without a model), the UI shows a model selector with loaded and available models. Selecting a model loads it automatically, and you can even switch models mid-conversation when regenerating a response.

## Customization

Default UI preferences can be set at launch with `--ui-config` (below will turn theme into dark one, render user message with markdown and turns long message into a file attachment.)

```sh
llama serve -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0 --ui-config '{"theme": "dark", "pasteLongTextToFileLen": 0, "renderUserContentAsMarkdown": true}'
```

<img src="https://huggingface.co/buckets/ggml-org/docs-media/resolve/ui_setting.png" alt="UI flag" />

For the story behind the interface and more usage examples, see the [WebUI guide discussion](https://github.com/ggml-org/llama.cpp/discussions/16938) on GitHub.
