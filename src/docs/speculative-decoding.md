# Speculative Decoding

Large language models generate text one token at a time. For every new token, the model weights and the KV cache have to be read from memory. This makes decoding mostly memory-bandwidth-bound and difficult to parallelize. You can learn more about this at the conceptual guide on [prefill and decode](./prefill-vs-decode.md).

Speculative decoding speeds up this process by asking a faster/smaller model to guess several tokens ahead. The large model then checks all those guesses in one forward pass. When the guesses are good, the large model produces several tokens for the cost of roughly one verification pass. When they are wrong, it rejects them and continues with a token sampled from its own distribution.

The result is lossless: speculative decoding changes how tokens are generated, but not the probability distribution they are sampled from. Unlike quantization, it does not approximate the target model's weights.

## Draft, verify, correct

Speculative decoding pairs the main model, called the **target model**, with a faster **drafter** (or assistant). The drafter is often a much smaller model.

One speculative decoding step looks like this:

1. The drafter generates several candidate tokens.
2. The target model verifies all the candidates in one forward pass.
3. The candidates are accepted until the first rejected token.
4. If a token is rejected, the target model samples a correction and a new round starts.

So we do not do multiple passes with a large model, but do smaller multiple passes and a single pass with LLM and save up on LLM inference. 
For example, for the input "the cat", the drafter can propose "sat on my lap". The target model can accept `sat` and `on`, reject `my`, and sample a correction. Tokens after the rejection are discarded because they were generated from a continuation that is no longer valid. The target model also samples one additional token when every draft token is accepted. This means a round with four draft tokens can add up to five tokens to the output. You can see this illustrated below.

![speculative decoding](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/speculative_decoding/speculative-decoding.png)

## Why the output stays the same

Let's call the drafter's token probability distribution `q(x)` and the target model's distribution `p(x)`.

For a draft token `x`, the acceptance probability is:

```text
acceptance probability = min(1, p(x) / q(x))
```

If the target model assigns at least as much probability to the token as the drafter does, the token is always accepted. Otherwise, it is accepted some of the time.

When a token is rejected, the correction is sampled from the normalized positive difference between the two distributions:

```text
correction distribution = normalize(max(0, p(x) - q(x)))
```

This formula basically penalizes the tokens that target model doesn't like but drafter does, and favors the tokens that target model likes but drafter model doesn't like. You can see this visually below.

[https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/speculative_decoding/correction-pool.png]

With greedy decoding, verification is simpler: draft tokens are accepted while they match the tokens selected by the target model.

## Why speculative decoding can be faster

During normal decoding, generating eight tokens requires eight sequential target-model passes. The model weights are read for every token the model generates, which causes a lot of back and forth reading from memory (bandwidth bound).

With speculative decoding, a small drafter guesses those eight tokens and the target model checks them together. If most guesses are accepted, we replace several expensive target-model passes with cheap and faster drafter tokens and one batched verification pass from target model only.

This works because verifying several tokens resembles prompt processing: the tokens can be processed together. GPUs are much better at this batched computation than at a sequence of small, memory-bound decode steps.

The approximate cost becomes `drafting time + verification time + correction overhead` instead of `one target-model decode pass per output token`.

Speculative decoding is most useful when the target model is large, decoding is memory-bandwidth-bound, and the drafter is both fast and accurate.

## The trade-off

Speculative decoding saves target-model memory bandwidth, but it introduces new work and often uses more memory as the drafter needs its own weights and KV cache. The target model also has to verify candidates that are later discarded. If the drafter is slow or predicts poorly, this overhead can be larger than the saved target-model work.

The main metric is the **draft acceptance rate**: `draft acceptance rate = accepted draft tokens / generated draft tokens`. 

A high acceptance rate is useful only if producing the drafts is cheap. A large drafter may predict the target model well while taking too long to provide a speed-up.

Some techniques reuse parts of the target model and add trainable modules (like EAGLE), they have a smaller memory overhead.

## How many tokens should the drafter generate?

Longer drafts give the target model more tokens to accept, but they also increase the chance that later work is discarded.

Rejection is sequential. If the third draft token is rejected, every token after it is discarded even if it would otherwise have been correct.

If each token has a 70% conditional chance of being accepted, the probability of accepting an entire prefix falls quickly:

```text
first token:     0.70
first 3 tokens:  0.70³ = 0.34
first 5 tokens:  0.70⁵ = 0.17
first 8 tokens:  0.70⁸ = 0.06
```

This is why more draft tokens do not automatically mean more speed. The best draft length depends on the drafter, target model, workload, hardware, and cost of verification.

Start with a short draft and benchmark end-to-end output throughput. Increase the length only while the number of accepted tokens grows enough to pay for the extra draft and verification work.

## Drafting approaches

### Draft model

Classical speculative decoding uses a smaller autoregressive model. It generates candidate tokens one at a time, then the target model verifies them as a batch.

The two models must use a compatible tokenizer, and the draft model should be trained or selected for the target model. Model authors often publish a matching drafter next to the main model.

This is the most general approach, but sequential drafting can become the new bottleneck when the target model or GPU is very fast.

### EAGLE-3

EAGLE-3 uses a small draft model that reads hidden states from the target model. These hidden states contain more information than token IDs alone, which can improve the acceptance rate for a drafter of the same size.

The drafter builds a tree of possible continuations. The target model verifies the tree in parallel with a tree attention mask, then accepts one valid path. Unused branches are discarded.

An EAGLE-3 drafter is trained for a specific target model, so use a drafter released for the exact model family and checkpoint.

### Multi Token Prediction

With Multi Token Prediction, or MTP, model authors train additional heads that predict future tokens from the model's hidden states.

The first head predicts the next token, another predicts one token further ahead, and so on. These predictions become the draft candidates, which are still verified before they are returned.

The maximum useful draft length is limited by the number of MTP heads in the model. Since the heads are part of the model design, MTP must be supported by the checkpoint; it cannot be added to an arbitrary model at inference time.

### DFlash

DFlash replaces sequential autoregressive drafting with a small block-diffusion model. It predicts a block of draft tokens in one forward pass and uses hidden states from the target model to improve those predictions.

This removes much of the sequential work from the drafting stage and makes the drafter more GPU-friendly. The maximum draft length is limited by the block size the draft model was trained with.

Like EAGLE-3, a DFlash drafter is trained for a specific target model.

### Reusing tokens from the context

Some workloads contain long repeated sequences, especially code editing, summarization, and rewriting. An n-gram drafter can search the existing context for a matching token sequence and propose the tokens that followed it previously.

This does not require another neural model. It has low overhead, but it only helps when the continuation can be found or predicted from repeated patterns in the context.

## Speculative decoding with llama.cpp

llama.app supports several speculative decoding implementations. It also downloads drafters automatically if the model drafter exists in the model repository, you can see Gemma-4 E2B with MTP below. It will also take care of serving when you click on the model to chat.

![Llama App Drafter](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/speculative_decoding/llama-app-drafter.png)


The exact model files and best draft length depend on the target checkpoint, so use a drafter published for that model and benchmark it on your own prompts.

Most drafter models are inside target model GGUF repositories. On the GGUF hardware compatibility tab there's drafter types and the memory they require.

![Speculator GGUFs](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/speculative_decoding/gguf-drafter.png)

If you want to serve models with drafters you can either do it on llama.app easily.

To use `llama serve` to serve models with drafters, you 

For DFlash, load the target and draft repositories, select the DFlash implementation, and set the maximum number of draft tokens:

```bash
llama-server \
  -hf ggml-org/Qwen3.8-27B-GGUF:Q4_K_M \
  -hfd z-lab/Qwen3.8-27B-DFlash2-GGUF:Q4_K_M \
  --spec-type draft-dflash \
  --spec-draft-n-max 7
```

For a model with MTP heads:

```bash
llama-server \
  -hf ggml-org/Qwen3.8-27B-GGUF:Q8_0 \
  --spec-type draft-mtp \
  --spec-draft-n-max 3
```

For EAGLE-3, pass a compatible draft model with `-md` or `-hfd`:

```bash
llama-server \
  -m Qwen3-4B.gguf \
  -md Qwen3-4B-eagle3.gguf \
  --spec-type draft-eagle3
```

The server prints speculative decoding statistics, including generated and accepted draft tokens. Compare the speculative run against the same workload without speculation. Acceptance rate alone is not enough: the metric that matters is end-to-end output tokens per second at an acceptable latency.

## Improving performance

- Use a drafter built for the exact target model. A mismatched drafter will have a low acceptance rate or may be incompatible.
- Keep the drafter small enough that drafting is substantially cheaper than running the target model.
- Do not maximize draft length blindly. Longer drafts increase discarded work after a rejection.
- Keep the draft model on a fast device when possible. Moving draft work over a slow CPU/GPU interconnect can remove the speed-up.
- Benchmark realistic prompts and sampling settings. Acceptance can change with the task, temperature, and output style.
- Watch both acceptance rate and output throughput. A higher acceptance rate does not guarantee a faster system.

Speculative decoding is not a fixed multiplier. It is a trade between cheap predictions and expensive verification. When the drafter is fast, its guesses match the target model, and decoding is limited by memory bandwidth, several output tokens can be produced for each target-model pass.
