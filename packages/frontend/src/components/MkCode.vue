<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<header v-if="!inline" :class="$style.codeBlockHeader">
	<button :class="$style.headerButton" class="_button" @click="copy">
		<i class="ti ti-dots"></i>
	</button>
</header>
<Suspense>
	<template #fallback>
		<MkLoading v-if="!inline ?? true"/>
	</template>
	<code v-if="inline" :class="$style.codeInlineRoot">{{ code }}</code>
	<XCode v-else-if="show && lang" :code="code" :lang="lang"/>
	<pre v-else-if="show" :class="$style.codeBlockFallbackRoot"><code :class="$style.codeBlockFallbackCode">{{ code }}</code></pre>
	<button v-else :class="$style.codePlaceholderRoot" @click="show = true">
		<div :class="$style.codePlaceholderContainer">
			<div><i class="ti ti-copy"></i> {{ i18n.ts.code }}</div>
			<div>{{ i18n.ts.clickToShow }}</div>
		</div>
	</button>
</Suspense>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import * as os from '@/os.js';
import MkLoading from '@/components/global/MkLoading.vue';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';

defineProps<{
	code: string;
	lang?: string;
	inline?: boolean;
}>();

const show = ref(!defaultStore.state.dataSaver.code);

const XCode = defineAsyncComponent(() => import('@/components/MkCode.core.vue'));

function copy() {
	copyToClipboard(props.code);
	os.success();
}
</script>

<style module lang="scss">
.codeBlockHeader {
	text-align: right;
	&.headerButton {
		margin: 0;
		padding: 8px;
		opacity: 0.7;

		&:not(:last-child) {
			margin-right: 28px;
		}

		&:hover {
			color: var(--fgHighlighted);
		}
	}
}

.codeInlineRoot {
	display: inline-block;
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
	overflow-wrap: anywhere;
	color: #D4D4D4;
	background: #1E1E1E;
	padding: .1em;
	border-radius: .3em;
}

.codeBlockFallbackRoot {
	display: block;
	overflow-wrap: anywhere;
	color: #D4D4D4;
	background: #1E1E1E;
	padding: 1em;
	margin: .5em 0;
	overflow: auto;
	border-radius: 8px;
}

.codeBlockFallbackCode {
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
}

.codePlaceholderRoot {
	display: block;
	width: 100%;
	background: none;
	border: none;
	outline: none;
  font: inherit;
  color: inherit;
	cursor: pointer;

	box-sizing: border-box;
	border-radius: 8px;
	padding: 24px;
	margin-top: 4px;
	color: #D4D4D4;
	background: #1E1E1E;
}

.codePlaceholderContainer {
	text-align: center;
	font-size: 0.8em;
}
</style>
