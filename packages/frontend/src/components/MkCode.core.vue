<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- eslint-disable vue/no-v-html -->
<template>
<div
	:class="[$style.codeBlockRoot, {
		[$style.codeEditor]: codeEditor,
		[$style.outerStyle]: !codeEditor && withOuterStyle,
		[$style.withMaxHeight]: maxHeight != null,
		[$style.dark]: darkMode,
		[$style.light]: !darkMode,
	}]" v-html="html"></div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, watch } from 'vue';
import { bundledLanguagesInfo } from 'shiki/langs';
import type { diffLines as diffLines_typeReferenceOnly } from 'diff';
import type { ShikiTransformer } from 'shiki/core';
import type { BundledLanguage } from 'shiki/langs';
import { getHighlighter, getTheme } from '@/utility/code-highlighter.js';
import { store } from '@/store.js';

const props = withDefaults(defineProps<{
	code: string;
	diffBase?: string;
	lang?: string;
	codeEditor?: boolean;
	withOuterStyle?: boolean;
	maxHeight?: number | null;
}>(), {
	codeEditor: false,
	withOuterStyle: true,
	maxHeight: null,
});

const maxHeight = computed(() => props.maxHeight != null ? `${props.maxHeight}px` : null);

const highlighter = await getHighlighter();
const diffLines = shallowRef<typeof diffLines_typeReferenceOnly | null>(null);

const darkMode = store.r.darkMode;
const codeLang = ref<BundledLanguage | 'aiscript' | 'text'>('js');

const [lightThemeName, darkThemeName] = await Promise.all([
	getTheme('light', true),
	getTheme('dark', true),
]);

const diffed = computed(() => {
	if (props.diffBase == null || diffLines.value == null) return null;

	// 行単位で組み立てることで、末尾に改行がない削除行と追加行が同じ行に連結されないようにする
	const lines: string[] = [];
	const lineTypes: ('add' | 'remove' | null)[] = [];
	for (const part of diffLines.value(props.diffBase, props.code)) {
		const partLines = part.value.split('\n');
		if (part.value.endsWith('\n')) partLines.pop();
		const type = part.added ? 'add' : part.removed ? 'remove' : null;
		for (const line of partLines) {
			lines.push(line);
			lineTypes.push(type);
		}
	}
	return { code: lines.join('\n'), lineTypes };
});

// コメント記法に依存せず行にクラスを付与するため、言語指定の無いプレーンテキストでも差分を表示できる
function transformerDiff(lineTypes: ('add' | 'remove' | null)[]): ShikiTransformer {
	return {
		name: 'misskey:diff',
		pre(node) {
			this.addClassToHast(node, 'has-diff');
		},
		line(node, line) {
			const type = lineTypes[line - 1];
			if (type != null) this.addClassToHast(node, ['diff', type]);
		},
	};
}

const html = computed(() => highlighter.codeToHtml(diffed.value?.code ?? props.code, {
	lang: codeLang.value,
	themes: {
		fallback: 'dark-plus',
		light: lightThemeName,
		dark: darkThemeName,
	},
	transformers: diffed.value != null ? [transformerDiff(diffed.value.lineTypes)] : [],
	defaultColor: false,
	cssVariablePrefix: '--shiki-',
}));

async function fetchLanguage(to: string): Promise<void> {
	// Shiki 組み込みのプレーンテキスト (言語ファイルの読み込み不要)
	if (['text', 'txt', 'plaintext', 'plain'].includes(to)) {
		codeLang.value = 'text';
		return;
	}

	const language = to as BundledLanguage;

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

watch(() => props.diffBase, async (to) => {
	if (to != null) {
		if (diffLines.value == null) {
			const { diffLines: dl } = await import('diff');
			diffLines.value = dl;
		}
	}
}, { immediate: true });

watch(() => props.lang, (to) => {
	if (codeLang.value === to || !to) return;
	return new Promise((resolve) => {
		fetchLanguage(to).then(() => resolve);
	});
}, { immediate: true });
</script>

<style module lang="scss">
.codeBlockRoot :global(.shiki) {
	overflow: auto;
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;

	color: var(--shiki-fallback);

	& span {
		color: var(--shiki-fallback);
	}

	& pre,
	& code {
		font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
	}

	&>code {
		display: block;
		min-width: fit-content;
	}

	& :global(.line) {
		display: inline-block;
		width: 100%;
	}
}

.codeBlockRoot :global(.shiki.has-diff) {
	& :global(.line.diff.remove) {
		background-color: rgba(244, 63, 94, .14);
		text-decoration: line-through;
	}

	& :global(.line.diff.add) {
		background-color: rgba(75, 192, 107, .14);
	}
}

.codeBlockRoot.withMaxHeight :global(.shiki) {
	max-height: v-bind(maxHeight);
	scrollbar-color: var(--MI_THEME-scrollbarHandle) transparent;
	scrollbar-width: thin;
}

.outerStyle.codeBlockRoot :global(.shiki) {
	padding: 1em;
	margin: 0;
	border-radius: 8px;
	border: 1px solid var(--MI_THEME-divider);
	background-color: var(--shiki-fallback-bg);
}

.light.codeBlockRoot :global(.shiki) {
	color: var(--shiki-light);

	& span {
		color: var(--shiki-light);
	}
}

.light.outerStyle.codeBlockRoot :global(.shiki),
.light.codeEditor.codeBlockRoot :global(.shiki) {
	background-color: var(--shiki-light-bg);
}

.dark.codeBlockRoot :global(.shiki) {
	color: var(--shiki-dark);

	& span {
		color: var(--shiki-dark);
	}
}

.dark.outerStyle.codeBlockRoot :global(.shiki),
.dark.codeEditor.codeBlockRoot :global(.shiki) {
	background-color: var(--shiki-dark-bg);
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
