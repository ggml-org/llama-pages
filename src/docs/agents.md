# Using Llama App with Agents

Llama App can be easily paired with your agents, this section shows how to do it for Pi and Codex / ChatGPT.

We recommend running models with a context window of at least 32k tokens, as agents can fill up context quickly. For good models to use, please refer to the [recommended models in this list](https://llama.app/models), paying special attention to those that mention "agentic coding".

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

To get started, simply start `llama serve`.

```bash
llama serve
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

Enter the server URL, the default is `http://127.0.0.1:9931`. Then run `/model` in Pi to select the model to use for the current session.

## ChatGPT desktop and Codex CLI

You can also use the ChatGPT desktop app and the OpenAI Codex CLI with Llama App. First, you need to install Codex CLI.

```bash
npm install -g @openai/codex
```

Add the following configuration to `~/.codex/config.toml`.

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
