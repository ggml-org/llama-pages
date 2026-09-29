# Prefill vs. Decode

Large language model inference has two distinct phases: **prefill**, when the model reads the prompt, and **decode**, when it produces the answer one token at a time. The same model runs in both phases, but the work changes enough that different hardware limits usually dominate.

## Prefill: reading the prompt

During prefill, the model processes the input tokens in parallel. Each transformer layer computes representations for the prompt and stores the attention **keys and values** in the KV cache.  The model then produces the probability distribution for the first output token. This makes time to first token roughly:

```text
time to first token ≈ prompt processing time + first token generation
```

So here's how prefill looks like. We do one pass through the model: we read the weights once to perform the computations on GPU, generate the first token, and save the KV cache to memory for future use.

![prefill](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/prefill.png)

### What affects the performance of prefill

Prefill is usually compute-bound, because the whole sequence is processed in parallel. "Compute-bound" is a fancy way to say that the more flops your GPU has, the faster it will do prefill. The following factors affect prefill performance:

- A longer prompt or longer context
- A larger or more computationally expensive model
- A slower processor or poorly optimized kernels

## Decode: writing the answer

After choosing the first output token, the model enters an autoregressive loop. The model generates a token, then appends that token to the conversation and then regenerates the next token until the end of the generation. For each generated token, the model weights and KV cache are read from memory to GPU, the token is generated and we write the new KV cache for the new token to memory.

![decode](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/decode.png)


Due to this repeated read/writes back and forth, decoding is bandwidth-bound. Batching inputs helps with this. When we decode multiple generations together, we read the weight for once for all the items in the batch, which makes decode compute-bound, and we can get better throughput (number of processed tokens increase).

### What makes decode slower

- A larger model or higher-precision weights
- Lower memory bandwidth
- CPU/GPU offloading across a slow interconnect
- A long active context, which increases KV-cache reads
- An implementation without optimized kernels for the model and hardware

Decode speed is often reported as **output tokens per second** or **time per output token**.

## KV Cache

KV cache is a trick to make attention run faster. Attention is the basic component of LLMs: each new token generation needs to look at all the previous tokens in the sequence. Therefore, it has quadratic complexity. Attention is composed of _keys_ and _values_ for every token, but once they have been calculated for a previous token in the sequence, we can cache the result and reuse it when generating a new token. This adds extra memory (which grows with context window) but makes inference much faster. In llama.cpp, the KV cache is pre-allocated for a given context window. In llama.app you can see the amount of memory a conversation will take including the model and the KV cache.

![KV Cache](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/kv-cache.png)

The memory consumption of KV cache depends on the model architecture, but we can approximate it with:

```text
KV-cache size ∝ layers × context length × KV heads × head dimension × bytes per element
```

Long conversations therefore have two costs:

1. More memory is reserved or consumed by the KV cache.
2. Each new token attends over more cached positions, increasing decode work and memory traffic.

Starting a fresh conversation, summarizing old turns, reducing the context limit, or quantizing the KV cache can help when supported by the runtime.

## Metrics that map to user experience

### Time to first token (TTFT)

From the moment you submit the initial prompt to the moment you see the first token, so it's about prefill. 

### Time per output token (TPOT)

The time it takes between subsequent generated tokens, which gives a signal on how fast conversation feels.

### Output throughput

The number of output tokens generated per second. You can benchmark this with `llama bench`.

```bash
# prefill 128 tokens, generate 64 tokens, run 3 times, benchmark throughput

llama bench -hf ggml-org/gemma-4-e4b-it-GGUF:Q4_0 -p 128 -n 64 -r 3

|     model   |     size     | params  | backend | threads | test |     t/s      |
| gemma3 1B Q4_K | 762.49 MiB | 999.89 M | MTL,BLAS |  5 | pp128 | 2184.32 ± 3.54 |
| gemma3 1B Q4_K | 762.49 MiB |   999.89 M | MTL,BLAS | 5 | tg64 |  115.03 ± 0.19 |
```

The number of runs you pass (three, in this case) increases the accuracy of the estimate.

### Aggregate throughput

The total tokens served across all active requests per second. Batching may improve this even when it increases latency for an individual request.

### End-to-end latency

The time from the moment you submit the prompt until the end of the generation:

```text
end-to-end latency ≈ TTFT + number of output tokens × TPOT
```

## Improving metrics

There are many tricks to improve the throughput and memory such as speculative decoding and quantization, which are covered under conceptual guides.
