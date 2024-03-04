<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- eslint-disable vue/no-v-html -->
<template>
<div :class="[$style.codeBlockRoot, { [$style.codeEditor]: codeEditor }, (darkMode ? $style.dark : $style.light)]" v-html="html"></div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { bundledLanguagesInfo } from 'shiki';
import type { BuiltinLanguage } from 'shiki';
import { getHighlighter, getTheme } from '@/scripts/code-highlighter.js';
import { defaultStore } from '@/store.js';

const props = defineProps<{
	code: string;
	lang?: string;
	codeEditor?: boolean;
}>();

const highlighter = await getHighlighter();
const darkMode = defaultStore.reactiveState.darkMode;
const codeLang = ref<BuiltinLanguage | 'aiscript'>('js');

const [lightThemeName, darkThemeName] = await Promise.all([
	getTheme('light', true),
	getTheme('dark', true),
]);

const html = computed(() => highlighter.codeToHtml(props.code, {
	lang: codeLang.value,
	themes: {
		fallback: 'dark-plus',
		light: lightThemeName,
		dark: darkThemeName,
	},
	defaultColor: false,
	cssVariablePrefix: '--shiki-',
}));

async function fetchLanguage(to: string): Promise<void> {
	const language = to as BuiltinLanguage;

	// Check for the loaded languages, and load the language if it's not loaded yet.
	if (!highlighter.getLoadedLanguages().includes(language)) {
		// Check if the language is supported by Shiki
		const bundles = bundledLanguagesInfo.filter((bundle) => {
			// Languages are specified by their id, they can also have aliases (i. e. "js" and "javascript")
			return bundle.id === language || bundle.aliases?.includes(language);
		});
		if (bundles.length > 0) {
			if (_DEV_) console.log(`Loading language: ${language}`);
			await highlighter.loadLanguage(bundles[0].import);
			codeLang.value = language;
		} else {
			codeLang.value = 'js';
		}
	} else {
		codeLang.value = language;
	}
}

watch(() => props.lang, (to) => {
	if (codeLang.value === to || !to) return;
	return new Promise((resolve) => {
		fetchLanguage(to).then(() => resolve);
	});
}, { immediate: true });
</script>

<style module lang="scss">
.codeBlockRoot :global(.shiki) {
	padding: 1em;
	margin: .5em 0;
	overflow: auto;
	border-radius: 8px;
	border: 1px solid var(--divider);
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;

	color: var(--shiki-fallback);
	background-color: var(--shiki-fallback-bg);

	& span {
		color: var(--shiki-fallback);
		background-color: var(--shiki-fallback-bg);
	}

	& pre,
	& code {
		font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
	}
}

.light.codeBlockRoot :global(.shiki) {
	color: var(--shiki-light);
	background-color: var(--shiki-light-bg);

	& span {
		color: var(--shiki-light);
		background-color: var(--shiki-light-bg);
	}
}

.dark.codeBlockRoot :global(.shiki) {
	color: var(--shiki-dark);
	background-color: var(--shiki-dark-bg);

	& span {
		color: var(--shiki-dark);
		background-color: var(--shiki-dark-bg);
	}
}

.codeBlockRoot.codeEditor {
	min-width: 100%;
	height: 100%;

	& :global(.shiki) {
		padding: 12px;
		margin: 0;
		border-radius: 6px;
		border: none;
		min-height: 130px;
		pointer-events: none;
		min-width: calc(100% - 24px);
		height: 100%;
		display: inline-block;
		line-height: 1.5em;
		font-size: 1em;
		overflow: visible;
		text-rendering: inherit;
    text-transform: inherit;
    white-space: pre;

		& span {
			display: inline-block;
			min-height: 1em;
		}
	}
}
</style>
