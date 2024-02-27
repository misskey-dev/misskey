<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :spacerMax="8" :spacerMin="8">
	<template #icon><i class="ti ti-arrows-sort"></i></template>
	<template #label>{{ i18n.ts._customEmojisManager._gridCommon.sortOrder }}</template>
	<div :class="$style.sortOrderArea">
		<div :class="$style.sortOrderAreaTags">
			<MkTagItem
				v-for="order in sortOrders"
				:key="order.key"
				:iconClass="order.direction === 'ASC' ? 'ti ti-arrow-up' : 'ti ti-arrow-down'"
				:exButtonIconClass="'ti ti-x'"
				:content="order.key"
				@click="onToggleSortOrderButtonClicked(order)"
				@exButtonClick="onRemoveSortOrderButtonClicked(order.key)"
			/>
		</div>
		<MkButton :class="$style.sortOrderAddButton" @click="onAddSortOrderButtonClicked">
			<span class="ti ti-plus"/>
		</MkButton>
	</div>
</MkFolder>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { i18n } from '@/i18n.js';
import MkFolder from '@/components/MkFolder.vue';
import MkTagItem from '@/components/MkTagItem.vue';
import MkButton from '@/components/MkButton.vue';
import { GridSortOrder, GridSortOrderKey, gridSortOrderKeys } from '@/pages/admin/custom-emojis-manager.impl.js';
import { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';

const emit = defineEmits<{
	(ev: 'update', sortOrders: GridSortOrder[]): void;
}>();

const props = defineProps<{
	sortOrders: GridSortOrder[];
}>();

const { sortOrders } = toRefs(props);

function onToggleSortOrderButtonClicked(order: GridSortOrder) {
	switch (order.direction) {
		case 'ASC':
			order.direction = 'DESC';
			break;
		case 'DESC':
			order.direction = 'ASC';
			break;
	}

	emitOrder(sortOrders.value);
}

function onAddSortOrderButtonClicked(ev: MouseEvent) {
	const menuItems: MenuItem[] = gridSortOrderKeys
		.filter(key => !sortOrders.value.map(it => it.key).includes(key))
		.map(it => {
			return {
				text: it,
				action: () => {
					emitOrder([...sortOrders.value, { key: it, direction: 'ASC' }]);
				},
			};
		});
	os.contextMenu(menuItems, ev);
}

function onRemoveSortOrderButtonClicked(key: GridSortOrderKey) {
	emitOrder(sortOrders.value.filter(it => it.key !== key));
}

function emitOrder(sortOrders: GridSortOrder[]) {
	emit('update', sortOrders);
}

</script>

<style module lang="scss">
.sortOrderArea {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: flex-start;
}

.sortOrderAreaTags {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: flex-start;
	flex-wrap: wrap;
	gap: 8px;
}

.sortOrderAddButton {
	display: flex;
	justify-content: center;
	align-items: center;
	box-sizing: border-box;
	min-width: 2.0em;
	min-height: 2.0em;
	max-width: 2.0em;
	max-height: 2.0em;
	padding: 8px;
	margin-left: auto;
	border-radius: 9999px;
	background-color: var(--buttonBg);
}
</style>
