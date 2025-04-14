<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import { makeIcon } from '$lib/utils';

	export let options: { value: string; label: string; icon?: string }[] = [];
	export let selected: string = 'all';
	export let buttonText: string = 'Sort By';

	let open = false;
	let el: HTMLElement;

	function selectOption(value: string) {
		selected = value;
		open = false;
		el.dispatchEvent(new CustomEvent('change', { detail: selected }));
	}

	function toggleDropdown() {
		open = !open;
	}

	function closeDropdown() {
		open = false;
	}

	function handleClickOutside(event: MouseEvent) {
		if (!el.contains(event.target as Node)) {
			closeDropdown();
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="dropdown" bind:this={el}>
	<button type="button" class="dropdown-toggle" on:click={toggleDropdown}>
		{buttonText}
	</button>
	{#if open}
		<div in:slide={{ duration: 200 }} out:slide={{ duration: 300 }} class="dropdown-menu">
			{#each options as option}
				<label class="dropdown-item">
					<input
						type="radio"
						name="radio-sort"
						value={option.value}
						checked={selected === option.value}
						on:change={() => selectOption(option.value)}
					/>
					{#if option.icon}{@html makeIcon(option.icon)}&nbsp;{/if}{option.label}
				</label>
			{/each}
		</div>
	{/if}
</div>

<style>
	@import './common.css';
</style>
