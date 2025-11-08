<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" :zPriority="'high'" @click="done(true)" @closed="emit('closed')">
	<div :class="$style.root" class="_gaps">
		<div class="_gaps_s">
			<div :class="$style.header">
				<div :class="$style.icon">
					<i class="ti ti-alert-triangle"></i>
				</div>
				<div :class="$style.title">{{ i18n.ts.muteConfirm }}</div>
			</div>
		</div>
		<div class="_gaps_s">
			<MkSelect :def="periodDef" v-model="periodModel">
				<template #label>{{ i18n.ts.mutePeriod }}</template>
			</MkSelect>
			<MkSelect :def="muteTypeDef" v-model="muteTypeModel">
				<template #label>{{ i18n.ts.muteType }}</template>
			</MkSelect>
		</div>
		<div :class="$style.buttons">
			<MkButton inline rounded @click="cancel">{{ i18n.ts.cancel }}</MkButton>
			<MkButton inline primary rounded @click="ok">{{ i18n.ts.ok }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { i18n } from '@/i18n.js';
import type { MkSelectItem, GetMkSelectValueTypesFromDef } from '@/components/MkSelect.vue';

const periodItems = [{
	value: 'indefinitely', label: i18n.ts.indefinitely,
}, {
	value: 'tenMinutes', label: i18n.ts.tenMinutes,
}, {
	value: 'oneHour', label: i18n.ts.oneHour,
}, {
	value: 'oneDay', label: i18n.ts.oneDay,
}, {
	value: 'oneWeek', label: i18n.ts.oneWeek,
}] as const satisfies MkSelectItem[];

const muteTypeItems = [{
	value: 'all', label: i18n.ts.all,
}, {
	value: 'timelineOnly', label: i18n.ts.muteTypeTimeline,
}] as const satisfies MkSelectItem[];

export type MkMuteSettingDialogDoneEvent = { canceled: true } | { canceled: false, period: GetMkSelectValueTypesFromDef<typeof periodItems>, type: GetMkSelectValueTypesFromDef<typeof muteTypeItems> };
</script>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, shallowRef } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import { useMkSelect } from '@/composables/use-mkselect.js';

const emit = defineEmits<{
	(ev: 'done', v: MkMuteSettingDialogDoneEvent): void;
	(ev: 'closed'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();

const {
	def: periodDef,
	model: periodModel,
} = useMkSelect({
	items: periodItems,
	initialValue: 'indefinitely',
});

const {
	def: muteTypeDef,
	model: muteTypeModel,
} = useMkSelect({
	items: muteTypeItems,
	initialValue: 'all',
});

// overload function を使いたいので lint エラーを無視する
function done(canceled: true): void;
function done(canceled: false, period: typeof periodModel.value, type: typeof muteTypeModel.value): void; // eslint-disable-line no-redeclare

function done(canceled: boolean, period?: typeof periodModel.value, type?: typeof muteTypeModel.value) { // eslint-disable-line no-redeclare
	emit('done', { canceled, period: period!, type: type! });
	modal.value?.close();
}

async function ok() {
	done(false, periodModel.value, muteTypeModel.value);
}

function cancel() {
	done(true);
}

/*
function onBgClick() {
	if (props.cancelableByBgClick) cancel();
}
*/
function onKeydown(evt: KeyboardEvent) {
	if (evt.key === 'Escape') cancel();
}

onMounted(() => {
	window.document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
	window.document.removeEventListener('keydown', onKeydown);
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	margin: auto;
	padding: 32px;
	width: 100%;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	background: var(--MI_THEME-panel);
	border-radius: 16px;
}

.header {
	display: flex;
	align-items: center;
	gap: 0.75em;
}

.icon {
	font-size: 18px;
	color: var(--MI_THEME-warn);
}

.title {
	font-weight: bold;
	font-size: 1.1em;
}

.urlAddress {
	padding: 10px 14px;
	border-radius: 8px;
	border: 1px solid var(--MI_THEME-divider);
	overflow-x: auto;
	white-space: nowrap;
}

.buttons {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: right;
}
</style>
