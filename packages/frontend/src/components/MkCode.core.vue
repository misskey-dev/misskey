<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- eslint-disable vue/no-v-html -->
<template>
<div class="codeBlockRoot" v-html="html"></div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { BUNDLED_LANGUAGES } from 'shiki';
import type { Lang as ShikiLang } from 'shiki';
import { getHighlighter } from '@/scripts/code-highlighter.js';

const props = defineProps<{
	code: string;
	lang?: string;
}>();

const highlighter = await getHighlighter();

const codeLang = ref<ShikiLang | 'aiscript'>('js');
const html = computed(() => highlighter.codeToHtml(props.code, {
	lang: codeLang.value,
	theme: 'dark-plus',
}));

async function fetchLanguage(to) {
	const language = to as ShikiLang;

	// Check for the loaded languages, and load the language if it's not loaded yet.
	if (!highlighter.getLoadedLanguages().includes(language)) {
		// Check if the language is supported by Shiki
		const bundles = BUNDLED_LANGUAGES.filter((bundle) => {
			// Languages are specified by their id, they can also have aliases (i. e. "js" and "javascript")
			return bundle.id === language || bundle.aliases?.includes(language);
		});
		if (bundles.length > 0) {
			await highlighter.loadLanguage(language);
			codeLang.value = language;
		} else {
			codeLang.value = 'js';
		}
	} else {
		codeLang.value = language;
	}
}

watch(() => props.lang, async (to) => {
	if (codeLang.value === to) return;
	await fetchLanguage(to);
}, { immediate: true, });
</script>

<style scoped lang="scss">
.codeBlockRoot :deep(.shiki) {
	padding: 1em;
	margin: .5em 0;
	overflow: auto;
	border-radius: .3em;

	& pre,
	& code {
		font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
	}
}
</style>
