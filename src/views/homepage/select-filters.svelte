<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import { makeIcon } from '$lib/utils';

	// Options provided from the parent component.
	export let options: { value: string; label: string; count: number }[] = [];
	// The currently selected option (a string). Use "all" for the "All" option.
	export let selected: string | string[] = ['all']; // Default to "All" selected for multi-select
	export let buttonText: string = 'Filter Post Type'; // Default button text
	export let isMultiSelect: boolean = false; // Default to single-select

	let open = false;
	let el: HTMLElement;

	// Define the "All" option.
	const allOption = {
		value: 'all',
		label: 'All',
		count: options.reduce((sum, option) => sum + (option.count || 0), 0)
	}; // Calculate total count for "All"

	function selectOption(value: string) {
		if (isMultiSelect) {
			if (value === 'all') {
				selected = ['all']; // Clear all other selections and select "All"
			} else {
				if (Array.isArray(selected)) {
					selected = selected.filter((v) => v !== 'all'); // Remove "All" if another option is selected
					if (selected.includes(value)) {
						selected = selected.filter((v) => v !== value);
					} else {
						selected = [...selected, value];
					}
				} else {
					selected = [value];
				}
			}
		} else {
			selected = value;
			open = false;
		}

		// Dispatch a native custom event with the selected value(s).
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
			<!-- Add "All" option for multi-select -->
			{#if isMultiSelect}
				<label class="dropdown-item">
					<input
						type="checkbox"
						value={allOption.value}
						checked={Array.isArray(selected) && selected.includes(allOption.value)}
						on:change={() => selectOption(allOption.value)}
					/>
					{allOption.label} ({allOption.count})
				</label>
			{/if}

			<!-- Options for multi-select or single-select -->
			{#each options as option}
				<label class="dropdown-item">
					<input
						type={isMultiSelect ? 'checkbox' : 'radio'}
						name="dropdown"
						value={option.value}
						checked={isMultiSelect ? selected.includes(option.value) : selected === option.value}
						on:change={() => selectOption(option.value)}
					/>

					{#if option.icon}{@html makeIcon(
							option.icon
						)}&nbsp;{/if}{option.label}{#if isMultiSelect}&nbsp;({option.count}){/if}
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
