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
import { getHighlighter } from '@/scripts/code-highlighter.js';
import { BUNDLED_LANGUAGES } from 'shiki';
import type { Lang } from 'shiki';

const props = defineProps<{
	code: string;
	lang?: string;
}>();

const highlighter = await getHighlighter();

const lang = ref<Lang | 'aiscript'>('js');
const html = computed(() => highlighter.codeToHtml(props.code, {
	lang: lang.value,
	theme: 'dark-plus',
}));

async function fetchLanguage(to) {
	const language = to as Lang;

	// Check for the loaded languages, and load the language if it's not loaded yet.
	if (!highlighter.getLoadedLanguages().includes(language)) {
		// Check if the language is supported by Shiki
		const bundles = BUNDLED_LANGUAGES.filter((bundle) => {
			// Languages are specified by their id, they can also have aliases (i. e. "js" and "javascript")
			return bundle.id === language || bundle.aliases?.includes(language);
		});
		if (bundles.length > 0) {
			await highlighter.loadLanguage(language);
			lang.value = language;
		} else {
			lang.value = 'js';
		}
	} else {
		lang.value = language;
	}
}

watch(() => props.lang, async (to) => {
	if (lang.value === to) return;
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
