# Quickstart

This guide takes you from a fresh [installation](installation) to chatting with a model in your terminal or through the Web UI.

## Download your first model

### Llama app

On the Llama app, click downwards arrow next to one of the models recommended for your platform.
<img src="https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/llama-onboarding.png" alt="Onboarding" />
Once downloaded, you can click on the model, which opens chat options. Depending on your memory and the length of the conversation you want to have, select the context window > Chat with the model.

<img src="https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/ctx-windows.png" alt="Context window" />

### Llama CLI

If you want to use the CLI to chat with models, pass a Hugging Face repository with the `-hf` flag. The model is downloaded automatically the first time you use it:

```sh
llama cli -hf unsloth/gemma-4-E4B-it-GGUF:Q4_K_M
```

We picked a 4-bit quantized version of Gemma-4 E4B, a model that can take image, text, and audio inputs, using just ~6GB of memory with a context window of 16k tokens. There are [thousands of GGUF models on Hugging Face](https://huggingface.co/models?library=gguf&sort=trending) to choose from.

Downloaded models are stored in the standard Hugging Face cache, so they are shared with other tools. List what's in your cache with `llama cli -cl`.

If you already have a `.gguf` file on disk, point at the file path with `-m`:

```sh
llama cli -m my-model.gguf
```

## Chat in the terminal

Running `llama cli` with a model drops you straight into an interactive chat:

```console
> hello, who are you?

[Start thinking]
*   Analyze the user request: The user is asking for my identity ("hello, who are you?").
    *   Core instruction check: I must identify myself as Gemma 4, developed by Google DeepMind, an open-weights LLM.
*   Formulate the response based on the instructions and provided persona.

    *   Name: Gemma 4.
    *   Developer: Google DeepMind.
    *   Nature: Large Language Model (LLM).
    *   Type: Open weights model.
*   Draft the response: "Hello! I am Gemma 4, an open weights large language model developed by Google DeepMind."
[End thinking]

Hello! I am Gemma 4, an open weights large language model developed by Google DeepMind. How can I help you today?

[ Prompt: 113.2 t/s | Generation: 36.1 t/s ]
```

See [Using the CLI](cli) for system prompts, sampling settings, multimodal input, and more.

## Serve a model

`llama serve` launches a server and exposes the model over HTTP. It comes with a full-featured chat UI.

```sh
llama serve -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0
```

Then open **http://localhost:8080** in your browser to use the [built-in web UI](webui), or call the API:

```sh
curl http://localhost:8080/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "messages": [
            {"role": "user", "content": "Give me a baklava recipe."}
        ]
    }'
```

Because the API is compatible with OpenAI endpoints, you can plug it in many different clients and harnesses.

```python
import openai

client = openai.OpenAI(base_url="http://localhost:8080/v1", api_key="no-key-required")

response = client.chat.completions.create(
    model="gemma-4-e4b-it",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

## Common options

Here are a few useful flags you can use with `llama cli` and `llama serve`:

| Flag               | What it does                                                         |
| ------------------ | -------------------------------------------------------------------- |
| `-c, --ctx-size N` | Context window size in tokens (`0` = use the model's native maximum) |
| `-sys "..."`       | Set a system prompt (CLI)                                            |

By default, llama.cpp automatically adjusts unset options to fit your device memory.

## Next steps

- [Using the CLI](cli) More advanced usage with Llama CLI
- [Running the server](serve) server configuration, routing and more
- [Web UI](webui) using & customizing convenient chat interface
- [API server](api) full API reference with examples
