<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils/shadcn-svelte.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { tv, type VariantProps } from 'tailwind-variants';

	// Mirrors llama.cpp/tools/ui's button so both apps share one button language.
	// `xl` is the addition: llama-pages' marketing CTA size, taller than
	// llama-ui's `lg`, for the hero and closing calls to action. On phones it
	// steps down to `lg`'s height, where the taller button crowds the hero.
	export const buttonVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		defaultVariants: {
			size: 'default',
			variant: 'default'
		},
		variants: {
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				icon: 'size-9',
				'icon-lg': 'size-10',
				'icon-sm': 'size-5 rounded-sm',
				lg: 'h-10 rounded-lg px-6 has-[>svg]:px-4',
				sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
				xl: 'h-10 gap-1.5 rounded-lg px-6 text-sm has-[>svg]:px-5 sm:h-12 sm:text-[15px]'
			},
			variant: {
				default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
				destructive:
					'bg-destructive shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white!',
				ghost: 'hover:text-accent-foreground hover:bg-muted-foreground/10 backdrop-blur-sm',
				link: 'text-primary underline',
				outline:
					'shadow-sm hover:text-accent-foreground hover:bg-muted-foreground/10 backdrop-blur-sm dark:border-input border',
				secondary:
					'bg-muted/30 dark:bg-muted-foreground/15 dark:text-secondary-foreground shadow-sm border-muted border text-foreground hover:bg-muted dark:hover:bg-muted-foreground/25',
				tertiary:
					'bg-muted/60 dark:bg-muted/75 shadow-sm border border-border/30 text-foreground hover:bg-muted/80 dark:border-border/20 dark:hover:bg-muted'
			}
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		children,
		class: className,
		disabled,
		href = undefined,
		ref = $bindable(null),
		size = 'default',
		type = 'button',
		variant = 'default',
		...restProps
	}: ButtonProps = $props();
</script>

<!-- Generic shadcn-svelte button primitive: `href` is a caller-supplied prop
     that may be internal or external, so consumers decide whether to wrap it
     in resolve() — this file can't know, so it's exempt from the rule. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if href}
	<a
		bind:this={ref}
		aria-disabled={disabled}
		class={cn(buttonVariants({ size, variant }), className)}
		data-slot="button"
		href={disabled ? undefined : href}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		class={cn(buttonVariants({ size, variant }), className)}
		data-slot="button"
		{disabled}
		{type}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}

<style>
	a,
	button {
		cursor: pointer;
	}
</style>
