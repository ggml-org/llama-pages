# Installation

There are several ways to get llama.cpp on your machine:

- Recommended: one-line install command
- Install with a package manager
- Download prebuilt binaries from the releases page
- Run with Docker
- Build from source

All of them give you the same set of tools (`llama cli`, `llama serve` and others).

## One-line install (recommended)

This is the easiest way to get started with llama.cpp. The following command detects your platform, fetches the latest version of the llama binary and installs it.

```bash
curl -LsSf https://llama.app/install.sh | sh
```

To pair with a coding agent, install with a package manager or build yourself, please follow the instructions in [https://llama.app](https://llama.app).

## Verify the installation

```sh
llama cli --version
```

If this prints the version and build info, you are ready to go. Continue with the [Quickstart](quickstart) to download and run your first model.
