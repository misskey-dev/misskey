<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<svg viewBox="0 0 200 150">
	<g fill-rule="evenodd">
		<rect width="200" height="150" :fill="themeVariables.bg"/>
		<rect width="64" height="150" :fill="themeVariables.navBg"/>
		<rect x="64" width="136" height="41" :fill="themeVariables.pageHeaderBg"/>
		<path transform="scale(.26458)" d="m439.77 247.19c-43.673 0-78.832 35.157-78.832 78.83v249.98h407.06v-328.81z" :fill="themeVariables.panel"/>
	</g>
	<circle cx="32" cy="83" r="21" :fill="themeVariables.accentedBg"/>
	<g>
		<rect x="120" y="88" width="40" height="6" ry="3" :fill="themeVariables.fg"/>
		<rect x="170" y="88" width="20" height="6" ry="3" :fill="themeVariables.mention"/>
		<rect x="120" y="108" width="20" height="6" ry="3" :fill="themeVariables.hashtag"/>
		<rect x="150" y="108" width="40" height="6" ry="3" :fill="themeVariables.fg"/>
		<rect x="120" y="128" width="40" height="6" ry="3" :fill="themeVariables.fg"/>
		<rect x="170" y="128" width="20" height="6" ry="3" :fill="themeVariables.link"/>
	</g>
	<path d="m65.498 40.892h137.7" :stroke="themeVariables.divider" stroke-width="0.75"/>
	<g transform="matrix(.60823 0 0 .60823 25.45 75.755)" fill="none" :stroke="themeVariables.accent" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
		<path d="m0 0h24v24h-24z" fill="none" stroke="none"/>
		<path d="m5 12h-2l9-9 9 9h-2"/>
		<path d="m5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
		<path d="m9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"/>
	</g>
	<g transform="matrix(.61621 0 0 .61621 25.354 117.92)" fill="none" :stroke="themeVariables.fg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
		<path d="m0 0h24v24h-24z" fill="none" stroke="none"/>
		<path d="m10 5a2 2 0 1 1 4 0 7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6"/>
		<path d="m9 17v1a3 3 0 0 0 6 0v-1"/>
	</g>
	<circle cx="32" cy="32" r="16" :fill="themeVariables.accent"/>
	<circle cx="140" cy="20" r="6" :fill="themeVariables.success"/>
	<circle cx="160" cy="20" r="6" :fill="themeVariables.warn"/>
	<circle cx="180" cy="20" r="6" :fill="themeVariables.error"/>
</svg>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import lightTheme from '@@/themes/_light.json5';
import darkTheme from '@@/themes/_dark.json5';
import type { Theme } from '@/theme.js';
import { compile } from '@/theme.js';
import { deepClone } from '@/utility/clone.js';

const props = defineProps<{
	theme: Theme;
}>();

const themeVariables = ref<{
	bg: string;
	panel: string;
	fg: string;
	mention: string;
	hashtag: string;
	link: string;
	divider: string;
	accent: string;
	accentedBg: string;
	navBg: string;
	pageHeaderBg: string;
	success: string;
	warn: string;
	error: string;
}>({
	bg: 'var(--MI_THEME-bg)',
	panel: 'var(--MI_THEME-panel)',
	fg: 'var(--MI_THEME-fg)',
	mention: 'var(--MI_THEME-mention)',
	hashtag: 'var(--MI_THEME-hashtag)',
	link: 'var(--MI_THEME-link)',
	divider: 'var(--MI_THEME-divider)',
	accent: 'var(--MI_THEME-accent)',
	accentedBg: 'var(--MI_THEME-accentedBg)',
	navBg: 'var(--MI_THEME-navBg)',
	pageHeaderBg: 'var(--MI_THEME-pageHeaderBg)',
	success: 'var(--MI_THEME-success)',
	warn: 'var(--MI_THEME-warn)',
	error: 'var(--MI_THEME-error)',
});

watch(() => props.theme, (theme) => {
	if (theme == null) return;

	const _theme = deepClone(theme);

	if (_theme.base != null) {
		const base = [lightTheme, darkTheme].find(x => x.id === _theme.base);
		if (base) _theme.props = Object.assign({}, base.props, _theme.props);
	}

	const compiled = compile(_theme);

	themeVariables.value = {
		bg: compiled.bg ?? 'var(--MI_THEME-bg)',
		panel: compiled.panel ?? 'var(--MI_THEME-panel)',
		fg: compiled.fg ?? 'var(--MI_THEME-fg)',
		mention: compiled.mention ?? 'var(--MI_THEME-mention)',
		hashtag: compiled.hashtag ?? 'var(--MI_THEME-hashtag)',
		link: compiled.link ?? 'var(--MI_THEME-link)',
		divider: compiled.divider ?? 'var(--MI_THEME-divider)',
		accent: compiled.accent ?? 'var(--MI_THEME-accent)',
		accentedBg: compiled.accentedBg ?? 'var(--MI_THEME-accentedBg)',
		navBg: compiled.navBg ?? 'var(--MI_THEME-navBg)',
		pageHeaderBg: compiled.pageHeaderBg ?? 'var(--MI_THEME-pageHeaderBg)',
		success: compiled.success ?? 'var(--MI_THEME-success)',
		warn: compiled.warn ?? 'var(--MI_THEME-warn)',
		error: compiled.error ?? 'var(--MI_THEME-error)',
	};
}, { immediate: true });
</script>
