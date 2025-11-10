<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" :zPriority="'high'" @click="done(true)" @closed="emit('closed')">
	<div :class="$style.root">
		<div v-if="title" class="_selectable" :class="$style.header">
			<Mfm :text="title"/>
		</div>
		<div v-if="text" :class="$style.text" class="_selectable">
			<Mfm :text="text"/>
		</div>
		<div class="_gaps_s">
			<MkSelect v-model="periodModel" :items="periodDef"></MkSelect>
			<MkInput
				v-if="periodModel === 'custom'"
				v-model="manualExpiresAt"
				type="datetime-local"
			></MkInput>
		</div>
		<div :class="$style.buttons">
			<MkButton inline rounded @click="cancel">{{ i18n.ts.cancel }}</MkButton>
			<MkButton inline primary rounded :disabled="!canSave" @click="ok">{{ i18n.ts.ok }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { i18n } from '@/i18n.js';
import type { MkSelectItem } from '@/components/MkSelect.vue';
import MkInput from './MkInput.vue';

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
}, {
	value: 'custom', label: i18n.ts.custom,
}] as const satisfies MkSelectItem[];

export type MkPeriodDialogDoneEvent = { canceled: true } | { canceled: false, expiresAt: number | null };
</script>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, useTemplateRef, ref, computed } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import { useMkSelect } from '@/composables/use-mkselect.js';

defineProps<{
	title?: string;
	text?: string;
}>();

const emit = defineEmits<{
	(ev: 'done', v: MkPeriodDialogDoneEvent): void;
	(ev: 'closed'): void;
}>();

const modal = useTemplateRef('modal');

const {
	def: periodDef,
	model: periodModel,
} = useMkSelect({
	items: periodItems,
	initialValue: 'indefinitely',
});

const now = Date.now();
const manualExpiresAt = ref<string | null>(null);
const canSave = computed(() => {
	if (periodModel.value === 'custom') {
		return manualExpiresAt.value != null && new Date(manualExpiresAt.value).getTime() > now;
	}
	return true;
});

// overload function を使いたいので lint エラーを無視する
function done(canceled: true): void;
function done(canceled: false, period: typeof periodModel.value): void; // eslint-disable-line no-redeclare

function done(canceled: boolean, period?: typeof periodModel.value) { // eslint-disable-line no-redeclare
	const expiresAt = (() => {
		if (canceled) return null;
		if (period === 'custom' && manualExpiresAt.value != null) {
			return new Date(manualExpiresAt.value!).getTime();
		}

		const now = Date.now();

		switch (period) {
			case 'indefinitely':
				return null;
			case 'tenMinutes':
				return now + 10 * 60 * 1000;
			case 'oneHour':
				return now + 60 * 60 * 1000;
			case 'oneDay':
				return now + 24 * 60 * 60 * 1000;
			case 'oneWeek':
				return now + 7 * 24 * 60 * 60 * 1000;
			default:
				return null;
		}
	})();

	if (canceled) {
		emit('done', { canceled: true });
	} else {
		emit('done', { canceled: false, expiresAt });
	}

	modal.value?.close();
}

async function ok() {
	done(false, periodModel.value);
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
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	background: var(--MI_THEME-panel);
	border-radius: 16px;
}

.header {
	margin: 0 0 8px 0;
	text-align: center;
	font-weight: bold;
	font-size: 1.1em;

	& + .text {
		margin-top: 8px;
	}
}

.text {
	margin: 16px 0 0 0;
}

.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}
</style>
