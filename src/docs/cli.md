# Using the CLI

`llama cli` is the terminal front end of llama.cpp: an interactive chat and a playground for experimenting with models, sampling settings, grammars, and multimodal input.

## Basic usage

Point it at a model, either a local file or a Hugging Face repo, and start chatting:

```sh
# Download from Hugging Face (cached after the first run)
llama cli -hf unsloth/gemma-4-E4B-it-GGUF:Q4_0

# Local GGUF file
llama cli -m my-model.gguf
```

You will see available commands as well as inputs for your model.

![llama cli output](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/llama-cli.png)

A few tips:

```sh
# Set a system prompt
llama cli -m model.gguf -sys "You are a concise assistant that answers in bullet points."

# Ask one question and exit when the answer finishes
llama cli -m model.gguf -st -p "Give me a baklava recipe"
```

## Controlling generation

Sampling parameters shape how the model generates text. llama.cpp will choose sensible defaults for the model you are using, but you can experiment and tweak them yourself:

```sh
llama cli -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0 --temp 0.2 --top-k 40 --top-p 0.95
```

| Flag                 | Default | What it does                                |
| -------------------- | ------- | ------------------------------------------- |
| `--temp N`           | `0.8`   | Randomness; lower is more deterministic     |
| `--top-k N`          | `40`    | Sample only from the K most likely tokens   |
| `--top-p N`          | `0.95`  | Nucleus sampling probability mass           |
| `--min-p N`          | `0.05`  | Drop tokens below this relative probability |
| `-n, --predict N`    | `-1`    | Max tokens to generate (`-1` = unlimited)   |
| `--repeat-penalty N` | `1.0`   | Penalize repeated token sequences           |

## Performance and memory

```sh
# Set the context window (0 = max context size model allows)
llama cli -m model.gguf -c 16384

# Keep MoE expert weights on the CPU; handy for big MoE models on small GPUs
llama cli -m model.gguf -cmoe
```

By default llama.cpp adjusts unset options to fit your available device memory (`--fit on`), so out-of-memory errors at startup are rare. Use `--list-devices` to see the available GPUs and `-dev` to pick specific ones.

## Multimodal input

Many LLMs support image or multimodal inputs. After you launch `llama cli` you can add and image to your prompt with the `/image` command (media comes first, then the text prompt that refers to the image):

```
> /image image.png

Loaded media from 'image.png'

> describe this image
```

For one-off media-text prompts, pass media files alongside your prompt.

```sh
llama cli -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0 --image "image.png" -p "Describe this image."
```

Similarly, you can use `/audio` for audio inputs in the CLI, or `--audio` for one-off audio-text pairs. Multiple files are allowed via comma-separated paths.

```
> /audio /Users/mervenoyan/Downloads/example_audio.mp3

Loaded media from '/Users/mervenoyan/Downloads/example_audio.mp3'

> transcribe this audio
```

## Reasoning models

For models with thinking/reasoning support, you can control the thinking behavior:

```sh
# Disable thinking entirely
llama cli -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0 -rea off

# Cap thinking at 1024 tokens
llama cli -m model.gguf --reasoning-budget 1024
```

## Speculative decoding

Speed up generation using speculative decoding assistant (or draft) models. This applies to models that support this feature, and you need to specify both the main model and the drafter:

```bash
llama cli -m big-model.gguf -md small-draft-model.gguf --spec-type draft-simple
```

For Hugging Face Hub GGUF repositories, you can point to large model and small model repositories. In some repositories, they are put together, in others, you can point to repositories containing main and assistant models separately.

```bash
llama cli -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0 --hf-repo-draft ggml-org/gemma-4-e4b-it-GGUF:Q4_0 --spec-type draft-mtp
```

`--spec-type` defaults to `none` (no drafting), usual choices are `draft-simple`, `draft-mtp`, or `draft-eagle3`, depending on the drafter style the model supports.

## Getting help

`llama cli -h` prints every option. The flags shown here are the ones you'll use most; the [full reference](https://github.com/ggml-org/llama.cpp/blob/master/tools/cli/README.md) documents more advanced settings.
