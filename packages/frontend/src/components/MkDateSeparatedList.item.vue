<template>
<slot :key="props.item.id"></slot>
<div v-if="nextItem != null && isDifferentDate" :class="$style.separator" :key="`${props.item.id}:separator`">
	<p :class="$style.date">
		<span :class="$style.date1">
			<i class="ti ti-chevron-up" :class="$style.date1Icon"></i>
			{{ getDateText(itemDate) }}
		</span>
		<span :class="$style.date2">
			{{ getDateText(nextItemDate!) }}
			<i class="ti ti-chevron-down" :class="$style.date2Icon"></i>
		</span>
	</p>
</div>
<MkAd v-else-if="ad && props.item._shouldInsertAd_" :key="`${props.item.id}:ad`" :prefer="['horizontal', 'horizontal-big']"></MkAd>
</template>

<script setup lang="ts" generic="E extends MisskeyEntity">
import { computed } from 'vue';
import { i18n } from '@/i18n.js';
import type { MisskeyEntity } from '@/types/date-separated-list.js';

const props = defineProps<{
	item: E;
	nextItem?: E;
	ad?: boolean;
}>();

const itemDate = computed(() => new Date(props.item.createdAt));
const nextItemDate = computed(() => props.nextItem ? new Date(props.nextItem.createdAt) : null);

const isDifferentDate = computed(() => {
	if (nextItemDate.value == null) return false;
	return (
		itemDate.value.getFullYear() !== nextItemDate.value.getFullYear() ||
		itemDate.value.getMonth() !== nextItemDate.value.getMonth() ||
		itemDate.value.getDate() !== nextItemDate.value.getDate()
	);
});

function getDateText(dateInstance: Date) {
	const date = dateInstance.getDate();
	const month = dateInstance.getMonth() + 1;
	return i18n.tsx.monthAndDay({
		month: month.toString(),
		day: date.toString(),
	});
}
</script>

<style lang="scss" module>
.separator {
	text-align: center;
}

.date {
	display: inline-block;
	position: relative;
	margin: 0;
	padding: 0 16px;
	line-height: 32px;
	text-align: center;
	font-size: 12px;
	color: var(--dateLabelFg);
}

.date1 {
	margin-right: 8px;
}

.date1Icon {
	margin-right: 8px;
}

.date2 {
	margin-left: 8px;
}

.date2Icon {
	margin-left: 8px;
}
</style>
