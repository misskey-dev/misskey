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
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import MkInput from '@/components/MkInput.vue';
import { formatDateTimeString } from '@/scripts/format-time-string.js';
import { addTime } from '@/scripts/time.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
  modelValue: {
		scheduledAt: number | null;
  };
}>();

const emit = defineEmits<{
  (ev: 'update:modelValue', v: {
		scheduledAt: number | null;
  }): void;
}>();

const atDate = ref(formatDateTimeString(addTime(new Date(), 1, 'day'), 'yyyy-MM-dd'));
const atTime = ref('00:00');

if (props.modelValue.scheduledAt) {
	const date = new Date(props.modelValue.scheduledAt);
	atDate.value = formatDateTimeString(date, 'yyyy-MM-dd');
	atTime.value = formatDateTimeString(date, 'HH:mm');
}

function get() {
	const calcAt = () => {
		return new Date(`${ atDate.value } ${ atTime.value }`).getTime();
	};

	return {
		...(
			{ scheduledAt: calcAt() }
		),
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
</script>
