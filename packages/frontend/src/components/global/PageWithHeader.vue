<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, reversed ? '_pageScrollableReversed' : '_pageScrollable']">
	<MkStickyContainer>
		<template #header><MkPageHeader v-model:tab="tab" v-bind="pageHeaderProps"/></template>
		<div :class="$style.body">
			<slot></slot>
		</div>
		<template #footer><slot name="footer"></slot></template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { PageHeaderProps } from './MkPageHeader.vue';

const props = defineProps<PageHeaderProps & {
	reversed?: boolean;
}>();

const pageHeaderProps = computed(() => {
	const { reversed, ...rest } = props;
	return rest;
});

const tab = defineModel<string>('tab');
</script>

<style lang="scss" module>
.root {

}

.body {
	min-height: calc(100cqh - (var(--MI-stickyTop, 0px) + var(--MI-stickyBottom, 0px)));
}
</style>
