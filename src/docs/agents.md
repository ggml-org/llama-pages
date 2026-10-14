# Bring Your Own Agent

Llama App can be paired easily with your agents. This section covers how to do this for every agent. For all of the below models, we recommend to run with context window of at least 32k tokens, running on variety of models recommended [here](https://llama.app/models) with mentions to "agentic coding".

## How It Works

The setup has two components running locally:

1. **Llama App** — Serves the model.
2. **Your agent** — The agent process that sends prompts to the local server, reasons about tasks, and executes actions.

```
┌─────────┐     API calls     ┌──────────────────┐
│  Agent  │ ───────────────▶  │  llama.cpp server│
│         │ ◀───────────────  │  (local model)   │
└─────────┘    responses      └──────────────────┘
     │
     ▼
  Your files,
  terminal, etc.
```

To get started, start `llama serve` in router mode (by passing in `--no-models-autoload`). If you want to browse models in any other folder than Hugging Face cache, use `--models-dir`.

```bash
llama serve \
  --no-models-autoload
```

This will spawn a server which by defaults listen in `http://127.0.0.1:9931`.
## Pi

[Pi](https://pi.dev) is an efficient and performant coding harness (it's also the one behind [OpenClaw](https://github.com/openclaw)). It integrates easily with Llama App.

Install Pi:

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

Start Pi in your project directory:

```bash
cd /path/to/project
pi
```

Configure Pi to use your Llama App server by running

```bash
/login llama.cpp
```

Enter the router URL and optional API key. The default URL is `http://127.0.0.1:9931`. Run `/llama` to load a model, then `/model` to select the loaded model for the current session.

## ChatGPT desktop and Codex CLI

You can use OpenAI Codex CLI with Llama App. First install Codex CLI.

```bash
npm install -g @openai/codex
```

Add below to `~/.codex/config.toml`.

```toml
model = "local-model"
model_provider = "llamacpp"

[model_providers.llamacpp]
name = "llama.cpp"
base_url = "http://127.0.0.1:9931/v1"
wire_api = "responses"
requires_openai_auth = false
supports_websockets = false
```

You can quit and rerun Codex desktop app and it will run on your local model.
To use Codex CLI, just run it in your project directory as follows.

```bash
cd /path/to/project
codex
```
