<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import { makeIcon } from '$lib/utils';

	export let options: { value: string; label: string; count: number; icon?: string }[] = [];
	export let selected: string[] = ['all'];
	export let buttonText: string = 'Filter Post Type';

	let open = false;
	let el: HTMLElement;

	const allOption = {
		value: 'all',
		label: 'All',
		count: options.reduce((sum, option) => sum + (option.count || 0), 0)
	};

	function selectOption(value: string) {
		if (value === 'all') {
			selected = ['all'];
		} else {
			selected = selected.includes(value)
				? selected.filter((v) => v !== value)
				: [...selected.filter((v) => v !== 'all'), value];
		}
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
			<label class="dropdown-item">
				<input
					type="checkbox"
					value={allOption.value}
					checked={selected.includes(allOption.value)}
					on:change={() => selectOption(allOption.value)}
				/>
				{allOption.label} ({allOption.count})
			</label>

			{#each options as option}
				<label class="dropdown-item">
					<input
						type="checkbox"
						value={option.value}
						checked={selected.includes(option.value)}
						on:change={() => selectOption(option.value)}
					/>
					{#if option.icon}{@html makeIcon(option.icon)}&nbsp;{/if}{option.label} ({option.count})
				</label>
			{/each}
		</div>
	{/if}
</div>

<style>
	@import './common.css';
</style>
