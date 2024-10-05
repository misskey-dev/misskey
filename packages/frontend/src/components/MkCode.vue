<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.codeBlockRoot">
	<button v-if="copyButton" :class="$style.codeBlockCopyButton" class="_button" @click="copy">
		<i class="ti ti-copy"></i>
	</button>
	<Suspense>
		<template #fallback>
			<MkLoading />
		</template>
		<XCode v-if="show && lang" :code="code" :lang="lang"/>
		<pre v-else-if="show" :class="$style.codeBlockFallbackRoot"><code :class="$style.codeBlockFallbackCode">{{ code }}</code></pre>
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
import * as os from '@/os.js';
import MkLoading from '@/components/global/MkLoading.vue';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';

const props = withDefaults(defineProps<{
	code: string;
	forceShow?: boolean;
	copyButton?: boolean;
	lang?: string;
}>(), {
	copyButton: true,
	forceShow: false,
});

const show = ref(props.forceShow === true ? true : !defaultStore.state.dataSaver.code);

const XCode = defineAsyncComponent(() => import('@/components/MkCode.core.vue'));

function copy() {
	copyToClipboard(props.code);
	os.success();
}
</script>

<style module lang="scss">
.codeBlockRoot {
	position: relative;
}

.codeBlockCopyButton {
	position: absolute;
	top: 8px;
	right: 8px;
	opacity: 0.5;

	&:hover {
		opacity: 0.8;
	}
}

.codeBlockFallbackRoot {
	display: block;
	overflow-wrap: anywhere;
	background: var(--bg);
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
	border: none;
	outline: none;
  font: inherit;
	cursor: pointer;

	box-sizing: border-box;
	border-radius: 8px;
	padding: 24px;
	margin-top: 4px;
	color: var(--fg);
	background: var(--bg);
}

.codePlaceholderContainer {
	text-align: center;
	font-size: 0.8em;
}
</style>
