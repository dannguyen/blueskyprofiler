<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';

	// Options provided from the parent component.
	export let options: { value: string; label: string; count: number }[] = [];
	// The currently selected option (a string). Use "all" for the "All" option.
	export let selected: string = '';

	let open = false;
	let el: HTMLElement;

	// Define the "All" option.
	const allOption = { value: 'all', label: 'All', count: null };

	function selectOption(value: string) {
		selected = value;
		open = false;
		// Dispatch a native custom event with the selected value.
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
		Filter Post Type
	</button>
	{#if open}
		<div in:slide={{ duration: 200 }} out:slide={{ duration: 300 }} class="dropdown-menu">
			<!-- "All" option -->
			<label class="dropdown-item">
				<input
					type="radio"
					name="dropdown"
					value={allOption.value}
					checked={selected === allOption.value}
					on:change={() => selectOption(allOption.value)}
				/>
				{allOption.label}
			</label>
			<!-- Other options -->
			{#each options as option}
				<label class="dropdown-item">
					<input
						type="radio"
						name="dropdown"
						value={option.value}
						checked={selected === option.value}
						on:change={() => selectOption(option.value)}
					/>
					{option.label}&nbsp;({option.count})
				</label>
			{/each}
		</div>
	{/if}
</div>

<style>
	@reference "../../app.css";

	.dropdown {
		position: relative;
		display: inline-block;
		@apply bg-sky-800 rounded p-1 mb-2;
	}
	.dropdown-toggle {
		@apply px-1 py-1;
		cursor: pointer;
	}
	.dropdown-menu {
		@apply px-3 py-1 bg-sky-800 mt-1;
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 1000;
		box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
	}
	.dropdown-item {
		display: block;
		@apply mt-1 text-xs;
	}
	.dropdown-item:last-child {
		@apply mb-1;
	}
</style>
