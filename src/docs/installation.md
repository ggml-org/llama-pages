# Installation

You can easily install llama.cpp on your machine:

- **Mac and Windows:** install the Llama app
- **Linux (or if you only want the command line):** one-line install command

## Llama app (recommended)

Download the app for [Mac](https://llama.app/download/mac) or [Windows 11](https://llama.app/download/windows). It lives in the menu bar on Mac and in the system tray on Windows.

The app also sets up the `llama` command line for you, so you can use `llama cli`, `llama serve` and other tools from a terminal.

## One-line install

If you're on Linux, or only want the command line, the following command detects your platform, fetches the latest `llama` binary and puts it on your PATH.

On Mac and Linux:

```sh
curl -LsSf https://llama.app/install.sh | sh
```

On Windows, using PowerShell:

```powershell
irm https://llama.app/install.ps1 | iex
```

## Other ways to install

llama.cpp is also available through package managers, as prebuilt binaries, and as Docker images, and you can build it from source. See llama.cpp's [installation](https://github.com/ggml-org/llama.cpp/blob/master/docs/install.md) and [build](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md) guides.

## Verify the installation

If you installed the app, its icon shows up in the menu bar (Mac) or the system tray (Windows). Click it to open the app:

<img src="https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/llama-app-install.png" alt="The Llama app on Mac" />

To check the command line, open a new terminal and run:

```sh
llama cli --version
```

If this prints the version and build info, you are ready to go.

Continue with the [Quickstart](quickstart) to download and run your first model, or see [Using Llama App with Agents](agents) to pair it with a coding agent.
