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

This basically penalizes the tokens that target model doesn't like but drafter does, and favors the tokens that target model likes but drafter model doesn't like. You can see this visually below.

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

Rejection is sequential. If the third draft token is rejected, every token after that token is discarded even if those tokens were correct. Let's say if each token has a 70% conditional chance of being accepted, the probability of accepting an entire prefix falls quickly:

```text
first token:     0.70
first 3 tokens:  0.70³ = 0.34
first 5 tokens:  0.70⁵ = 0.17
first 8 tokens:  0.70⁸ = 0.06
```

This is why more draft tokens do not automatically mean more speed. Start with a short draft and benchmark end-to-end output throughput. Increase the length only while the number of accepted tokens grows enough to pay for the extra draft and verification work.

## Drafting approaches

We will go through each drafting approach. How you can use drafter models in Llama.cpp or Llama app is given in the next section.

### Initial speculative decoding

Classical speculative decoding uses a smaller language model. It generates candidate tokens one at a time, then the target model verifies them as a batch.

The two models must use a compatible tokenizer, and the draft model should be trained or selected for the target model. Model authors often publish a matching drafter next to the main model.

### EAGLE

EAGLE series of speculative decoding is one of the most popular methods today. EAGLE is based on the idea that the full passes on target model to generate the next token are too expensive. Let's say we have the token "sat", "sat" is passed through LLM embeddings → all transformer layers → we get features for sat (f(sat)), this is passed to LM head, we get "on". After transformer layers we get exact feature for the next token, which we pass to LM head to decode. 

EAGLE drafter consists of a module that consists of three parts: 
1. Target model's embedding layer
2. Trainable EAGLE autoregression head
3. Target model's language modelling head

With EAGLE drafter, above process becomes: f(cat) + embedding("sat") → small EAGLE autoregression head → EAGLE's features for "sat" (f̂(sat)) → target model LM head → "on". EAGLE simply tries to estimate the features and tries to make it as similar as possible to target LLM's features, so it can discard the transformer layers from the generation process. 

EAGLE uses features from previous token and embedding from current token to predict features for the current token to pass to LM head. The second trick with the drafter model is that it actually predicts a tree of multiple generations, and target model evaluates the tree in one forward pass and discards paths.

![EAGLE pass](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/speculative_decoding/eagle-pass.png)

![EAGLE verification](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/speculative_decoding/eagle-verification.png)

Latest update to EAGLE is EAGLE-3. Compared to EAGLE, EAGLE-3 no longer has to reproduce target's hidden features. Let's take the token "cat", it takes multiple hidden states for the word "cat" from target model, combines them into `g(cat)`. This `g(cat)`, combined with embedding for the word "sat", is passed to EAGLE-3 drafter to produce another hidden vector (`a(sat)`), passed to LM head to predict "on". So pipeline is `g(cat) + embedding(sat) → EAGLE-3 drafter → a(sat) → LM head → proposed token "on"`. 
These hidden states contain more information than token IDs alone, which can improve the acceptance rate for a drafter of the same size. EAGLE-3 drafter still creates a tree, similarly to EAGLE.

EAGLE/EAGLE-3 drafters are trained for a specific target model, so use a drafter released for the exact model checkpoint and quant.

### DFlash

DFlash replaces sequential autoregressive drafting with a small block-diffusion model which is much faster compared to other techniques that use autoregressive generation like EAGLE-3.

It is very similar to EAGLE-3, it uses target model's embeddings and LM head. Given an input text, let's say "The answer is", the target model generates the token "42", which the authors call "anchor". This is concatenated with mask tokens as many as the number of draft tokens to be generated: `[42, MASK, MASK, MASK, ...]` as a placeholder.  At the same time, hidden states from several layers of the target model are concatenated, converted into K/V and injected to drafter layers. This gives rich representations draft model can work with. Then input is passed through the target embedding → drafter → target LM head, outputting tokens. You can see the entire process visualized below.

![DFlash](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/speculative_decoding/dflash.png) 

The maximum draft length is limited by the block size the draft model was trained with.

Like EAGLE-3, a DFlash drafter is trained for a specific target model.

### n-gram 

Some workloads contain long repeated sequences, especially code editing, summarization, and rewriting. An n-gram drafter can search the existing context for a matching token sequence and propose the tokens that followed it previously. 

This does not require another model. It has low overhead, but it only helps when the continuation can be found or predicted from repeated patterns in the context. It is especially useful for cases like repetitive code, JSON etc.

## Speculative decoding with llama.cpp

Llama app (and llama.cpp) supports several speculative decoding implementations. It also downloads drafters automatically if the model drafter exists in the model repository, you can see Gemma-4 E2B with MTP below. It will also take care of serving when you click on the model to chat.

![Llama App Drafter](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/speculative_decoding/llama-app-drafter.png)

Most drafter models are inside target model GGUF repositories, they are also trained by model authors. On the GGUF hardware compatibility tab there's drafter types and the memory they require.

![Speculator GGUFs](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/speculative_decoding/gguf-drafter.png)


To use `llama serve` to serve models with drafters, you can pass in speculative decoding specific parameters: 
- `--spec-type` is drafter type, `draft-eagle3`, `draft-dflash`, `draft-dspark`, `draft-mtp`. You can access the full list of the supported methods [here](https://github.com/ggml-org/llama.cpp/resolve/master/docs/speculative.md#general-speculative-parameters)
- `--spec-draft-n-max` number of tokens drafter can generate. For DFlash and DSpark it is clamped to the draft model's trained block size. 
- `hfd` if the drafter is separately stored in another repository, pass repo ID with this parameter.

For DFlash, load the target and draft repositories, select the DFlash implementation, and set the maximum number of draft tokens:

```bash
llama serve \
  -hf ggml-org/Qwen3.8-27B-GGUF:Q4_K_M \
  -hfd z-lab/Qwen3.8-27B-DFlash2-GGUF:Q4_K_M \
  --spec-type draft-dflash \
  --spec-draft-n-max 7
```

For a model with MTP drafter, this is how it looks like when the model and drafter are in the same repository.

```bash
llama serve \
  -hf ggml-org/Qwen3.8-27B-GGUF:Q8_0 \
  --spec-type draft-mtp \
  --spec-draft-n-max 3
```

## Improving performance

- Use a drafter built for the exact target model. A mismatched drafter will have a low acceptance rate or may be incompatible.
- Do not maximize for number of drafted tokens. Longer drafts increase discarded tokens.
- Watch both acceptance rate and throughput.
