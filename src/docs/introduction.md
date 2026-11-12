# Introduction

Llama App is a desktop app (built on llama.cpp) that lets you download and run large language models locally and chat with them in a few clicks on Mac and Windows.

The app lives in your Mac's menu bar or Windows system tray. Choose from models recommended for your platform, download one, and start chatting. Click the link on the [main page](https://llama.app/) to install the app. Once downloaded the app, pick the [model of your choice on Hugging Face Hub](https://huggingface.co/models?apps=llama-app&sort=trending), or simply pick one of the model recommendations on the app.

<video src="https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/llama-lfm.mp4" aria-label="Using a model from the Hub" autoplay muted loop playsinline controls></video>

## Command-line tools

Llama App also sets up the `llama` command line, so you can chat in your terminal with `llama cli` or run an OpenAI-compatible server with a built-in web interface using `llama serve`. On Linux, or if you only want the command line, use the [one-line installer](installation#one-line-install).

```sh
# Chat in your terminal
llama cli -hf LiquidAI/LFM3-Omni-2B-GGUF

# Serve an OpenAI-compatible API + web UI
llama serve -hf LiquidAI/LFM3-Omni-2B-GGUF
```

`llama cli` is great for [experimentation and terminal use](cli), while `llama serve` exposes a [full-featured web UI](webui).

## Next steps

- [Installation](installation) — install Llama App or the command-line tools
- [Quickstart](quickstart) — download a model and run it in minutes
- [Using the CLI](cli) — chat and experiment from the terminal with `llama cli`
- [Running a server](serve) — serve models over HTTP with `llama serve`
- [API server](api) — the OpenAI-compatible REST API reference
- [Web UI](webui) — the built-in browser chat interface
