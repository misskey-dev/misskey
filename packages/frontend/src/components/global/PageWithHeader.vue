<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="[$style.root, reversed ? '_pageScrollableReversed' : '_pageScrollable']">
	<MkStickyContainer>
		<template #header><MkPageHeader v-model:tab="tab" v-bind="pageHeaderProps"/></template>
		<div :class="$style.body">
			<MkSwiper v-if="swipable" v-model:tab="tab" :tabs="props.tabs">
				<slot></slot>
			</MkSwiper>
			<slot v-else></slot>
		</div>
		<template #footer><slot name="footer"></slot></template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import { scrollInContainer } from '@@/js/scroll.js';
import type { PageHeaderProps } from './MkPageHeader.vue';
import { useScrollPositionKeeper } from '@/use/use-scroll-position-keeper.js';
import MkSwiper from '@/components/MkSwiper.vue';

const props = defineProps<PageHeaderProps & {
	reversed?: boolean;
	swipable?: boolean;
}>();

const pageHeaderProps = computed(() => {
	const { reversed, ...rest } = props;
	return rest;
});

const tab = defineModel<string>('tab');
const rootEl = useTemplateRef('rootEl');

useScrollPositionKeeper(rootEl);

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
