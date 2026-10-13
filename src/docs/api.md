# API server

`llama serve` exposes a REST API on `http://localhost:9931` in various formats:

- **OpenAI-compatible** endpoints under `/v1/...` works with existing OpenAI SDKs and apps
- An **Anthropic-compatible** `/v1/messages` endpoint
- **llama.cpp endpoints** with extra capabilities (lower level options)

If the server was started with `--api-key`, pass it as a Bearer token: `Authorization: Bearer YOUR_KEY`.

## Chat completions

`POST /v1/chat/completions` is the endpoint you'll use most. It accepts the standard OpenAI chat format, with streaming supported via `"stream": true`:

```sh
curl http://localhost:9931/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Write a limerick about python exceptions"}
        ]
    }'
```

Or with the OpenAI Python SDK — only the base URL changes:

```python
import openai

client = openai.OpenAI(base_url="http://localhost:9931/v1", api_key="no-key-required")

completion = client.chat.completions.create(
    model="local-model",
    messages=[{"role": "user", "content": "Write a limerick about python exceptions"}],
)
print(completion.choices[0].message.content)
```

On top of the OpenAI parameters, llama.cpp-specific generation parameters are accepted in the same request body.

### Structured output

Constrain the response to valid JSON, or to a specific schema:

```json
{
	"messages": [{ "role": "user", "content": "Extract the name and date: ..." }],
	"response_format": {
		"type": "json_schema",
		"schema": {
			"type": "object",
			"properties": {
				"name": { "type": "string" },
				"date": { "type": "string" }
			},
			"required": ["name", "date"]
		}
	}
}
```

Use `{"type": "json_object"}` for free-form JSON.

### Tool calling

OpenAI-style function calling works with any model native formats are used for models trained on tool use, with a generic fallback for the rest. Pass `tools` and `tool_choice` as usual. See the [function calling docs](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md) for supported model families.

### Multimodal input

Vision and audio models accept typed content parts in messages:

```json
{
	"messages": [
		{
			"role": "user",
			"content": [
				{ "type": "text", "text": "What is in this image?" },
				{ "type": "image_url", "image_url": { "url": "https://example.com/photo.jpg" } }
			]
		}
	]
}
```

`image_url.url` can be a remote URL or base64 data URI; `input_audio` works the same way for audio files.

### Reasoning models

For thinking models, the parsed reasoning is returned in `message.reasoning_content`, separate from the final answer in `message.content` (configurable with `--reasoning-format`).

### Timings and usage

Responses include a standard OpenAI `usage` object, plus a llama.cpp `timings` object with tokens-per-second stats and the number of prompt tokens reused from cache (`cache_n`) — useful for tracking performance and context usage.

## Other OpenAI-compatible endpoints

| Endpoint               | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `POST /v1/completions` | Text completion from a raw `prompt`                                  |
| `POST /v1/responses`   | OpenAI Responses API (translated to chat completions internally)     |
| `POST /v1/embeddings`  | Embeddings — requires a pooling-enabled model (see [serving](serve)) |
| `POST /v1/rerank`      | Rank documents against a query — requires a reranker model           |
| `GET /v1/models`       | Model metadata (id, context size, parameters)                        |

The model `id` reported by `/v1/models` defaults to the model file path; set a friendly name with `--alias`.

## Anthropic-compatible endpoint

`POST /v1/messages` accepts the Anthropic Messages API format, including `system`, `stop_sequences`, streaming, and tool use — so Anthropic SDKs and apps can point at llama serve too:

```sh
curl http://localhost:9931/v1/messages \
    -H "Content-Type: application/json" \
    -H "x-api-key: your-api-key" \
    -d '{
        "model": "local-model",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": "Hello!"}]
        }'
```

`POST /v1/messages/count_tokens` counts input tokens without generating.

## Native endpoints

These expose llama.cpp features beyond the OpenAI surface:

| Endpoint                                     | Purpose                                                                                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /health`                                | Liveness check: `200` when ready, `503` while loading                                                                                    |
| `POST /completion`                           | Native completion with the full llama.cpp option set (token arrays, `n_probs` logprobs, `id_slot` pinning, per-request LoRA scales, ...) |
| `POST /tokenize` / `POST /detokenize`        | Convert between text and tokens                                                                                                          |
| `POST /apply-template`                       | Apply the model's chat template without running inference                                                                                |
| `POST /infill`                               | Fill-in-the-middle code completion from `input_prefix` and `input_suffix`                                                                |
| `GET /props`                                 | Server and model properties (context size, chat template, modalities)                                                                    |
| `GET /slots`                                 | Current state of each processing slot                                                                                                    |
| `GET /metrics`                               | Prometheus metrics (requires `--metrics`)                                                                                                |
| `GET /lora-adapters` / `POST /lora-adapters` | List and set LoRA adapter scales at runtime                                                                                              |

A minimal native completion request:

```sh
curl http://localhost:9931/completion \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Building a website can be done in 10 simple steps:", "n_predict": 128}'
```

## Router mode

When [serving multiple models](serve), the same API routes requests by model name — the `"model"` field in POST bodies, or a `?model=` query parameter on GET endpoints. `GET /models` lists all available models with their load status and modalities, and `POST /models/load` / `POST /models/unload` manage them explicitly.

## Errors

Errors use the OpenAI format:

```json
{
	"error": {
		"code": 401,
		"message": "Invalid API Key",
		"type": "authentication_error"
	}
}
```

For exhaustive request/response schemas and every endpoint option, see the [server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md).
