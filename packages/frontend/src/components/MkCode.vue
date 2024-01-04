<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<Suspense>
		<template #fallback>
			<MkLoading v-if="!inline ?? true" />
		</template>
		<code v-if="inline" :class="$style.codeInlineRoot">{{ code }}</code>
		<XCode v-else :code="code" :lang="lang"/>
	</Suspense>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';

defineProps<{
	code: string;
	lang?: string;
	inline?: boolean;
}>();

const XCode = defineAsyncComponent(() => import('@/components/MkCode.core.vue'));
</script>

<style module lang="scss">
.codeInlineRoot {
	display: inline-block;
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
	overflow-wrap: anywhere;
	color: #D4D4D4;
	background: #1E1E1E;
	padding: .1em;
	border-radius: .3em;
}
</style>
