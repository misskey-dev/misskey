<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- eslint-disable vue/no-v-html -->
<template>
<div :class="[$style.codeBlockRoot, { [$style.codeEditor]: codeEditor }]" v-html="html"></div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { bundledLanguagesInfo } from 'shiki';
import type { BuiltinLanguage } from 'shiki';
import { getHighlighter } from '@/scripts/code-highlighter.js';

const props = defineProps<{
	code: string;
	lang?: string;
	codeEditor?: boolean;
}>();

const highlighter = await getHighlighter();

const codeLang = ref<BuiltinLanguage | 'aiscript'>('js');
const html = computed(() => highlighter.codeToHtml(props.code, {
	lang: codeLang.value,
	theme: 'dark-plus',
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
			console.log(`Loading language: ${language}`);
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

	& pre,
	& code {
		font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
	}
}

.codeBlockRoot.codeEditor {
	min-width: 100%;
	height: 100%;

	& :global(.shiki) {
		padding: 12px;
		margin: 0;
		border-radius: 6px;
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
	}
}
</style>
