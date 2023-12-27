<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps dslkjkwejflew">
	<MkInput v-model="value.name" :readonly="!props.editable">
		<template #label>{{ i18n.ts.name }}</template>
	</MkInput>
	<MkInput v-model="value.targetUserPattern" placeholder="^(LocalUser|RemoteUser@RemoteHost)$" :readonly="!props.editable" :code="true">
		<template #label>{{ i18n.ts._abuse._resolver.targetUserPattern }}</template>
	</MkInput>
	<MkInput v-model="value.reporterPattern" placeholder="^(LocalUser|.*@RemoteHost)$" :readonly="!props.editable" :code="true">
		<template #label>{{ i18n.ts._abuse._resolver.reporterPattern }}</template>
	</MkInput>
	<MkInput v-model="value.reportContentPattern" placeholder=".*" :readonly="!props.editable" :code="true">
		<template #label>{{ i18n.ts._abuse._resolver.reportContentPattern }}</template>
	</MkInput>
	<MkSelect v-model="value.expiresAt" :disabled="!props.editable">
		<template #label>{{ i18n.ts._abuse._resolver.expiresAt }}<span v-if="expirationDate" style="float: right;"><MkDate :time="expirationDate" mode="absolute">{{ expirationDate }}</MkDate></span></template>
		<option value="1hour">{{ i18n.ts._abuse._resolver['1hour'] }}</option>
		<option value="12hours">{{ i18n.ts._abuse._resolver['12hours'] }}</option>
		<option value="1day">{{ i18n.ts._abuse._resolver['1day'] }}</option>
		<option value="1week">{{ i18n.ts._abuse._resolver['1week'] }}</option>
		<option value="1month">{{ i18n.ts._abuse._resolver['1month'] }}</option>
		<option value="3months">{{ i18n.ts._abuse._resolver['3months'] }}</option>
		<option value="6months">{{ i18n.ts._abuse._resolver['6months'] }}</option>
		<option value="1year">{{ i18n.ts._abuse._resolver['1year'] }}</option>
		<option value="indefinitely">{{ i18n.ts._abuse._resolver.indefinitely }}</option>
	</MkSelect>
	<MkSwitch v-model="value.forward" :disabled="!props.editable">
		{{ i18n.ts.forwardReport }}
		<template #caption>{{ i18n.ts.forwardReportIsAnonymous }}</template>
	</MkSwitch>
	<slot name="button"></slot>
</div>
</template>
<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	modelValue?: {
		name: string;
		targetUserPattern: string | null;
		reporterPattern: string | null;
		reportContentPattern: string | null;
		expiresAt: string;
		forward: boolean;
		expirationDate: string;
		previousExpiresAt?: string;
	}
	editable: boolean;
	data?: {
		name: string;
		targetUserPattern: string | null;
		reporterPattern: string | null;
		reportContentPattern: string | null;
		expirationDate: string | null;
		expiresAt: string;
		forward: boolean;
		previousExpiresAt?: string;
	}
}>();
const expirationDate = ref<Date | null>(null);

type NonNullType<T> = {
	[P in keyof T]: NonNullable<T[P]>
}

const emit = defineEmits(['update:modelValue']);

const value = computed({
	get() {
		const data = props.data ?? props.modelValue ?? {
			name: '',
			targetUserPattern: '',
			reporterPattern: '',
			reportContentPattern: '',
			expirationDate: null,
			expiresAt: 'indefinitely',
			forward: false,
			previousExpiresAt: undefined,
		};
		for (const [key, _value] of Object.entries(data)) {
			if (_value === null) {
				data[key] = '';
			}
		}
		if (props.modelValue && props.editable) {
			emit('update:modelValue', data);
		}
		return data as NonNullType<typeof data>;
	},
	set(updateValue) {
		if (props.modelValue && props.editable) {
			emit('update:modelValue', updateValue);
		}
	},
});

function renderExpirationDate(empty = false) {
	if (value.value.expirationDate && !empty) {
		expirationDate.value = new Date(value.value.expirationDate);
	} else {
		expirationDate.value = null;
	}
}

watch(() => value.value.expirationDate, () => renderExpirationDate(), { immediate: true });
watch(() => value.value.expiresAt, () => renderExpirationDate(true));
watch(() => props.editable, () => {
	if (props.editable) {
		value.value.previousExpiresAt = value.value.expiresAt;
	}
});

</script>
<style lang="scss" module>
.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;
}
</style>
