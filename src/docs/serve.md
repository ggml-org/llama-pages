# Running a server

`llama serve` is a single command to launch fast, lightweight HTTP server for LLM inference. It gives you:

- An [OpenAI-compatible API](api) (chat completions, completions, embeddings, and more)
- A built-in [web UI](webui) for chatting in the browser
- Parallel decoding with multi-user support and continuous batching

## Starting the server

```sh
# From a Hugging Face repo (downloaded and cached automatically)
llama serve -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0

# From a local GGUF file
llama serve -m my-model.gguf
```

By default the server listens on `http://127.0.0.1:8080`. Open that address in a browser for the web UI, or send API requests to it:

```sh
curl http://localhost:8080/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
```

## Common configuration

```sh
llama serve -m model.gguf \
    -c 16384 \ # context size (pass 0 for model's native maximum)
    -ngl all \          # GPU offload (default: auto)
    --host 0.0.0.0 \    # listen on all interfaces (default: 127.0.0.1)
    --port 8080
```

| Flag                   | What it does                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| `-c, --ctx-size N`     | Context size in tokens; `-c 0` uses the model's full context window |
| `-ngl, --gpu-layers N` | Layers to offload to GPU (`auto`, `all`, or a number)               |
| `-np, --parallel N`    | Number of server slots for concurrent requests (default: auto)      |
| `--host`, `--port`     | Bind address and port (default `127.0.0.1:8080`)                    |
| `-a, --alias NAME`     | Model name reported by the API                                      |
| `--api-key KEY`        | Require an API key (comma-separated list for multiple keys)         |
| `--no-webui`           | Disable the web UI, serve the API only                              |

Every option also has an environment-variable form (shown in `llama serve --help`), which is handy for containers:

```yml
services:
  llamacpp-server:
    image: ghcr.io/ggml-org/llama.cpp:server
    ports:
      - '8080:8080'
    volumes:
      - ./models:/models
    environment:
      LLAMA_ARG_HOST: '0.0.0.0'
      LLAMA_ARG_MODEL: /models/my_model.gguf
      LLAMA_ARG_CTX_SIZE: 4096
      LLAMA_ARG_N_PARALLEL: 2
      LLAMA_ARG_PORT: 8080
```

## Serving multiple users

The server handles concurrent requests out of the box. Each parallel _slot_ holds one conversation; the context is shared across slots:

```sh
# up to 4 concurrent requests
llama serve -m model.gguf -c 16384 -np 4
```

Prompt caching is enabled by default, so repeated requests with a shared prefix (like a system prompt, or an ongoing chat) skip reprocessing what the server has already seen.

## Beyond chat: embeddings, reranking, multimodal

`llama serve` can be used to serve embeddings and rerankers for retrieval workflows, and supports multimodal models (image, audio, PDFs).

```sh
# Embedding server (use with the /v1/embeddings endpoint)
llama serve \
  -hf unsloth/embeddinggemma-300m-GGUF \
  --embedding \
  --port 8080

# Send text pairs
curl http://127.0.0.1:8080/v1/embeddings \
  -H 'Content-Type: application/json' \
  -d '{"input": ["The cat sat on the mat", "A feline rested on a rug"]}'
```

Similarly, you can serve reranking models with llama serve as follows.

```sh
# reranker (use with the /v1/rerank endpoint)
llama serve -m reranker-model.gguf --rerank

# rerankers on Hugging Face Hub
llama serve \
  -hf ggml-org/Qwen3-reranker-0.6B-Q8_0-GGUF:Q8_0 \
  --embedding --rerank --pooling rank \
  --port 8080

# query rerank endpoint
curl http://127.0.0.1:8080/v1/rerank \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "What is panda?",
    "top_n": 3,
    "documents": [
      "hi",
      "it is a bear",
      "The giant panda is a bear species endemic to China."
    ]
  }'

# {"model":"ggml-org/Qwen3-reranker-0.6B-Q8_0-GGUF:Q8_0","object":"list","usage":{"prompt_tokens":241,"total_tokens":241},"results":[{"index":2,"relevance_score":0.14964470267295837},{"index":1,"relevance_score":0.0058668069541454315},{"index":0,"relevance_score":0.00028348760679364204}]}%
```

You can search for [rerankers](https://huggingface.co/models?pipeline_tag=text-ranking&apps=llama.cpp&sort=trending) and [embeddings](https://huggingface.co/models?pipeline_tag=sentence-similarity&apps=llama.cpp&sort=trending) that support llama.cpp on Hugging Face Hub.

You can run any multimodal model like text-only models.

```sh
llama serve -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0
```

Once served, you can send images through [webui](webui#attachments) with drag-and-drop or dropdown, or through the standard OpenAI chat format, see the [API docs](api).

## Speculative decoding

Pair the model with a small draft model to speed up generation:

```bash
llama serve -m big-model.gguf -md small-draft-model.gguf --spec-type draft-simple
```

For model repositories that contain main model and drafter model (as well as separate repositories), you can serve llama server as follows.

```bash
llama serve -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0 --hf-repo-draft ggml-org/gemma-4-e4b-it-GGUF:Q4_0 --spec-type draft-mtp
```

## Serving multiple models (router mode)

Launched **without a model**, `llama serve` launches a router that loads and unloads models on demand and forwards each request to the right instance:

```sh
llama serve
```

Models can come from three sources:

1. **The cache** — anything previously downloaded with `-hf` (see it with `llama serve -cl`)
2. **A models directory** — `llama serve --models-dir ./models_directory`
3. **A preset file** — `llama serve --models-preset ./my-models.ini`

Note that when sending requests, you need to specify the model name.

```sh
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer no-key" \
  -d '{
    "model": "ggml-org/gemma-3-4b-it-qat-GGUF:Q4_0",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

You can list the available model names as follows.

```sh
(base) ➜  ~ curl -s http://localhost:8080/v1/models | jq '.data[].id'
"LiquidAI/LFM2.5-230M-GGUF:Q4_K_M"
"ggml-org/Qwen3-Reranker-0.6B-Q8_0-GGUF:Q8_0"
"ggml-org/gemma-3-4b-it-qat-GGUF:Q4_0"
```

Server will automatically load it for inference.

![router](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/router.png)

For the complete flag reference, see [the server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md). Continue to the [API documentation](api) for the endpoints, or the [web UI guide](webui) for the browser interface.
