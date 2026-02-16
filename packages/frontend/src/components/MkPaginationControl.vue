<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.control">
		<MkSelect v-model="order" :class="$style.order" :items="orderDef">
			<template #prefix><i class="ti ti-arrows-sort"></i></template>
		</MkSelect>
		<MkButton v-if="paginator.canSearch" v-tooltip="i18n.ts.search" iconOnly transparent rounded :active="searchOpened" @click="searchOpened = !searchOpened"><i class="ti ti-search"></i></MkButton>
		<MkButton v-if="canFilter" v-tooltip="i18n.ts.filter" iconOnly transparent rounded :active="filterOpened" @click="filterOpened = !filterOpened"><i class="ti ti-filter"></i></MkButton>
		<MkButton v-tooltip="i18n.ts.dateAndTime" iconOnly transparent rounded :active="date != null" @click="date = date == null ? Date.now() : null"><i class="ti ti-calendar-clock"></i></MkButton>
		<MkButton v-tooltip="i18n.ts.reload" iconOnly transparent rounded @click="paginator.reload()"><i class="ti ti-refresh"></i></MkButton>
	</div>

	<MkInput
		v-if="searchOpened"
		v-model="q"
		type="search"
		debounce
	>
		<template #label>{{ i18n.ts.search }}</template>
		<template #prefix><i class="ti ti-search"></i></template>
	</MkInput>

	<MkInput
		v-if="date != null"
		type="date"
		:modelValue="formatDateTimeString(new Date(date), 'yyyy-MM-dd')"
		@update:modelValue="date = new Date($event).getTime()"
	>
	</MkInput>

	<slot v-if="filterOpened"></slot>
</div>
</template>

<script lang="ts" setup generic="T extends IPaginator">
import { ref, watch } from 'vue';
import type { IPaginator } from '@/utility/paginator.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import MkSelect from '@/components/MkSelect.vue';
import MkInput from '@/components/MkInput.vue';
import { formatDateTimeString } from '@/utility/format-time-string.js';
import { useMkSelect } from '@/composables/use-mkselect.js';

const props = withDefaults(defineProps<{
	paginator: T;
	canFilter?: boolean;
	filterOpened?: boolean;
}>(), {
	canFilter: false,
	filterOpened: false,
});

const searchOpened = ref(false);
const filterOpened = ref(props.filterOpened);

const {
	model: order,
	def: orderDef,
} = useMkSelect({
	items: [
		{ label: i18n.ts._order.newest, value: 'newest' },
		{ label: i18n.ts._order.oldest, value: 'oldest' },
	],
	initialValue: 'newest',
});
const date = ref<number | null>(null);
const q = ref<string | null>(null);

watch(order, () => {
	props.paginator.order.value = order.value;
	props.paginator.initialDirection = order.value === 'oldest' ? 'newer' : 'older';
	props.paginator.reload();
});

watch(date, () => {
	props.paginator.initialDate = date.value;
	props.paginator.reload();
});

watch(q, () => {
	props.paginator.searchQuery.value = q.value;
	props.paginator.reload();
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 10px;
}

.control {
	display: flex;
	align-items: center;
	gap: 4px;
}

.order {
	flex: 1;
	margin-right: 6px;
}
</style>
