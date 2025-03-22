<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer class="_pageScrollable">
	<template #header><MkPageHeader v-model:tab="tab" :actions="actions" :tabs="tabs"/></template>
	<slot></slot>
	<template #footer><slot name="footer"></slot></template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import type { PageHeaderItem } from '@/types/page-header.js';
import type { Tab } from './MkPageHeader.tabs.vue';

const props = withDefaults(defineProps<{
	tabs?: Tab[];
	actions?: PageHeaderItem[] | null;
	thin?: boolean;
	hideTitle?: boolean;
	displayMyAvatar?: boolean;
}>(), {
	tabs: () => ([] as Tab[]),
});

const tab = defineModel<string>('tab');
</script>

<style lang="scss" module>

</style>
