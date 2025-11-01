<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.codeBlockRoot">
	<button v-if="copyButton" :class="[$style.codeBlockCopyButton, { [$style.withOuterStyle]: withOuterStyle }]" class="_button" @click="copy">
		<i class="ti ti-copy"></i>
	</button>
	<Suspense>
		<template #fallback>
			<pre
				class="_selectable"
				:class="[$style.codeBlockFallbackRoot, {
					[$style.outerStyle]: withOuterStyle,
				}]"
			><code :class="$style.codeBlockFallbackCode">Loading...</code></pre>
		</template>
		<XCode
			v-if="show && lang"
			class="_selectable"
			:code="code"
			:lang="lang"
			:withOuterStyle="withOuterStyle"
		/>
		<pre
			v-else-if="show"
			class="_selectable"
			:class="[$style.codeBlockFallbackRoot, {
				[$style.outerStyle]: withOuterStyle,
			}]"
		><code :class="$style.codeBlockFallbackCode">{{ code }}</code></pre>
		<button v-else :class="$style.codePlaceholderRoot" @click="show = true">
			<div :class="$style.codePlaceholderContainer">
				<div><i class="ti ti-code"></i> {{ i18n.ts.code }}</div>
				<div>{{ i18n.ts.clickToShow }}</div>
			</div>
		</button>
	</Suspense>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { i18n } from '@/i18n.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { prefer } from '@/preferences.js';

const props = withDefaults(defineProps<{
	code: string;
	forceShow?: boolean;
	copyButton?: boolean;
	withOuterStyle?: boolean;
	lang?: string;
}>(), {
	copyButton: true,
	forceShow: false,
	withOuterStyle: true,
});

const show = ref(props.forceShow === true ? true : !prefer.s.dataSaver.code);

const XCode = defineAsyncComponent(() => import('@/components/MkCode.core.vue'));

function copy() {
	copyToClipboard(props.code);
}
</script>

<style module lang="scss">
.codeBlockRoot {
	position: relative;
}

.codeBlockCopyButton {
	position: absolute;
	opacity: 0.5;

	top: 0;
	right: 0;

	&.withOuterStyle {
		top: 8px;
		right: 8px;
	}

	&:hover {
		opacity: 0.8;
	}
}

.codeBlockFallbackRoot {
	display: block;
	overflow-wrap: anywhere;
	overflow: auto;
}

.outerStyle.codeBlockFallbackRoot {
	background: var(--MI_THEME-bg);
	padding: 1em;
	margin: .5em 0;
	border-radius: 8px;
	border: 1px solid var(--MI_THEME-divider);
}

.codeBlockFallbackCode {
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
}

.codePlaceholderRoot {
	display: block;
	width: 100%;
	border: none;
	outline: none;
  font: inherit;
	cursor: pointer;

	box-sizing: border-box;
	border-radius: 8px;
	padding: 24px;
	margin-top: 4px;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-bg);
}

.codePlaceholderContainer {
	text-align: center;
	font-size: 0.8em;
}
</style>
