<script lang="ts">
	// The headphones glyph marking models that take audio input (speech,
	// sounds). The audio counterpart of ModelsCatalogVisionBadge, shown in the
	// same places and styled the same way. Headphones rather than a waveform:
	// the badge means the model listens, and a waveform could read as "speaks".
	// `class` lets each caller size/position it for its context.
	let { class: cls = '' }: { class?: string } = $props();
</script>

<svg
	aria-label="audio input"
	role="img"
	viewBox="0 0 16 16"
	class="size-3.5 text-sky-600 {cls}"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d="M2.5 10.5V8a5.5 5.5 0 0 1 11 0v2.5" />
	<rect x="1.75" y="9.5" width="3" height="4.5" rx="1" />
	<rect x="11.25" y="9.5" width="3" height="4.5" rx="1" />
</svg>
