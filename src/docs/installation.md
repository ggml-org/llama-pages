# Installation

There are several ways to get llama.cpp on your machine:

- Recommended (Mac/Windows): one click install the desktop apps
- Recommended (others): one-line install command
- Install with a package manager
- Download prebuilt binaries from the releases page
- Run with Docker
- Build from source

All of them give you the same set of tools (`llama cli`, `llama serve` and others).

## One-click install (recommended)

If you intend to use LLMs on Mac or Windows, you can download the app from the main page, which launches right after installation.

## One-line install (recommended)

This is the easiest way to get started with llama.cpp. The following command detects your platform, fetches the latest version of the llama binary and installs it.

```sh
curl -LsSf https://llama.app/install.sh | sh
```

To pair with a coding agent, install with a package manager or build yourself, please follow the instructions in [https://llama.app](https://llama.app).

## Verify the installation

If you have downloaded the Llama app, it should show up on your bottom bar as dropdown.

<img src="https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/llama-app-install.png" alt="Installation" />

If you want to use CLI or on other platforms that don't support the app, type:

```sh
llama cli --version
```

If this prints the version and build info, you are ready to go. Continue with the [Quickstart](quickstart) to download and run your first model.
