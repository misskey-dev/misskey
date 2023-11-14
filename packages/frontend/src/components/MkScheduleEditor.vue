<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div style="padding: 8px 16px">
	<section class="_gaps_s">
		<MkInput v-model="atDate" small type="date" class="input">
			<template #label>{{ i18n.ts._schedulePost.postDate }}</template>
		</MkInput>
		<MkInput v-model="atTime" small type="time" class="input">
			<template #label>{{ i18n.ts._schedulePost.postTime }}</template>
			<template #caption>{{ i18n.ts._schedulePost.localTime }}</template>
		</MkInput>
	</section>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkInput from './MkInput.vue';
import { formatDateTimeString } from '@/scripts/format-time-string.js';
import { addTime } from '@/scripts/time.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
  modelValue: {
		scheduledAt: string;
  };
}>();
const emit = defineEmits<{
  (ev: 'update:modelValue', v: {
		scheduledAt: string;
  }): void;
}>();

const atDate = ref(formatDateTimeString(addTime(new Date(), 1, 'day'), 'yyyy-MM-dd'));
const atTime = ref('00:00');
if ( props.modelValue && props.modelValue.scheduledAt) {
	atDate.value = atTime.value = props.modelValue.scheduledAt;
}

function get() {
	const calcAt = () => {
		return new Date(`${atDate.value} ${atTime.value}`).getTime();
	};

	return {
		...(
			props.modelValue ? { scheduledAt: calcAt() } : {}
		),
	};
}

watch([atDate, atTime], () => emit('update:modelValue', get()), {
	immediate: true,
});
</script>
