<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" :zPriority="'high'" @click="done(true)" @closed="emit('closed')">
	<div :class="$style.root" class="_gaps">
		<div class="_gaps_s">
			<div :class="$style.icon">
				<i :class="$style.iconInner" class="ti ti-alert-triangle"></i>
			</div>
			<header :class="$style.title">{{ i18n.ts._externalNavigationWarning.title }}</header>
			<div><Mfm :text="i18n.ts._externalNavigationWarning.description"/></div>
			<div class="_monospace" :class="$style.urlAddress">{{ url }}</div>
			<div>
				<MkSwitch v-model="trustThisDomain">{{ i18n.tsx._externalNavigationWarning.trustThisDomain({ domain }) }}</MkSwitch>
			</div>
		</div>
		<div :class="$style.buttons">
			<MkButton inline primary rounded @click="ok">{{ i18n.ts.ok }}</MkButton>
			<MkButton inline rounded @click="cancel">{{ i18n.ts.cancel }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
type Result = string | number | true | null;

export type MkUrlWarningDialogDoneEvent = { canceled: true } | { canceled: false, result: Result };
</script>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, computed } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';

const props = defineProps<{
	url: string;
}>();

const emit = defineEmits<{
	(ev: 'done', v: MkUrlWarningDialogDoneEvent): void;
	(ev: 'closed'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();
const trustThisDomain = ref(false);

const domain = computed(() => new URL(props.url).hostname);

// overload function を使いたいので lint エラーを無視する
function done(canceled: true): void;
function done(canceled: false, result: Result): void; // eslint-disable-line no-redeclare
function done(canceled: boolean, result?: Result): void { // eslint-disable-line no-redeclare
	emit('done', { canceled, result } as MkUrlWarningDialogDoneEvent);
	modal.value?.close();
}

async function ok() {
	const result = true;
	if (!prefer.s.trustedDomains.includes(domain.value) && trustThisDomain.value) {
		prefer.commit('trustedDomains', prefer.s.trustedDomains.concat(domain.value));
	}
	done(false, result);
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
	document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
	document.removeEventListener('keydown', onKeydown);
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
	text-align: center;
	background: var(--MI_THEME-panel);
	border-radius: 16px;
}

.icon {
	font-size: 24px;
	color: var(--MI_THEME-warn);
}

.iconInner {
	display: block;
	margin: 0 auto;
}

.title {
	font-weight: bold;
	font-size: 1.1em;
}

.urlAddress {
	padding: var(--MI-margin);
	border-radius: calc(var(--MI-radius) / 2);
	border: 1px solid var(--MI_THEME-divider);
	overflow-x: auto;
	white-space: nowrap;
}

.buttons {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}
</style>
