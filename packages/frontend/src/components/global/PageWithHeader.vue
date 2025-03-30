<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="[$style.root, reversed ? '_pageScrollableReversed' : '_pageScrollable']">
	<MkStickyContainer>
		<template #header><MkPageHeader v-model:tab="tab" :actions="actions" :tabs="tabs"/></template>
		<div :class="$style.body">
			<slot></slot>
		</div>
		<template #footer><slot name="footer"></slot></template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import { scrollInContainer } from '@@/js/scroll.js';
import type { PageHeaderItem } from '@/types/page-header.js';
import type { Tab } from './MkPageHeader.tabs.vue';

const props = withDefaults(defineProps<{
	tabs?: Tab[];
	actions?: PageHeaderItem[] | null;
	thin?: boolean;
	hideTitle?: boolean;
	displayMyAvatar?: boolean;
	reversed?: boolean;
}>(), {
	tabs: () => ([] as Tab[]),
});

const tab = defineModel<string>('tab');
const rootEl = useTemplateRef('rootEl');

defineExpose({
	scrollToTop: () => {
		if (rootEl.value) scrollInContainer(rootEl.value, { top: 0, behavior: 'smooth' });
	},
});
</script>

<style lang="scss" module>
.root {

}

.body {
	min-height: calc(100cqh - (var(--MI-stickyTop, 0px) + var(--MI-stickyBottom, 0px)));
}
</style>
