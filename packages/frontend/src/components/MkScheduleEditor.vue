<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div style="padding: 8px 16px;">
	<section>
		<MkInput v-model="atDate" small type="date" class="input">
			<template #label>{{ i18n.ts._poll.deadlineDate }}</template>
		</MkInput>
		<MkInput v-model="atTime" small type="time" class="input">
			<template #label>{{ i18n.ts._poll.deadlineTime }}</template>
		</MkInput>
	</section>
	<div v-if="isInvalid" style="color: var(--error);">
		{{ i18n.ts.cannotScheduleInPast }}
	</div>
	<div v-if="scheduledDelete && isBeforeScheduledPost" style="color: var(--error);">
		{{ i18n.ts.cannotScheduleDeleteEarlierThanNow }}
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, onUnmounted, computed } from 'vue';
import MkInput from '@/components/MkInput.vue';
import { formatDateTimeString } from '@/utility/format-time-string.js';
import { addTime } from '@/utility/time.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	modelValue: {
		scheduledAt: number | null;
	};
	scheduledDelete?: {
		deleteAt: number | null;
	} | null;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: {
		scheduledAt: number | null;
		isValid: boolean;
	}): void;
	(ev: 'destroyed'): void;
}>();

const atDate = ref(formatDateTimeString(addTime(new Date(), 1, 'day'), 'yyyy-MM-dd'));
const atTime = ref('00:00');

function calcAt() {
	return new Date(`${atDate.value} ${atTime.value}`).getTime();
}

const isInvalid = computed(() => {
	return calcAt() <= Date.now();
});

const isBeforeScheduledPost = computed(() => {
	if (!props.scheduledDelete || !props.scheduledDelete.deleteAt || !calcAt()) return false;
	return props.scheduledDelete.deleteAt <= calcAt();
});

if (props.modelValue.scheduledAt) {
	const date = new Date(props.modelValue.scheduledAt);
	atDate.value = formatDateTimeString(date, 'yyyy-MM-dd');
	atTime.value = formatDateTimeString(date, 'HH:mm');
}

function get() {
	return {
		scheduledAt: calcAt(),
		isValid: !isInvalid.value,
	};
}

watch([
	atDate,
	atTime,
], () => emit('update:modelValue', get()), {
	deep: true,
});

onMounted(() => {
	emit('update:modelValue', get());
});

onUnmounted(() => {
	emit('destroyed');
});
</script>
