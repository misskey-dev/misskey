<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<!-- 現在のステータス -->
	<FormSection v-if="currentStatus">
		<template #label>{{ i18n.ts._customStatus.currentStatus }}</template>
		<div style="display: flex; align-items: center; gap: 12px; padding: 8px 0;">
			<span style="font-size: 1.5em;">{{ currentStatus.emoji ?? '💬' }}</span>
			<span style="font-size: 1.1em;">{{ currentStatus.text }}</span>
			<span v-if="currentStatus.expiresAt" style="font-size: 0.85em; color: var(--MI_THEME-fgTransparent);">
				〜{{ new Date(currentStatus.expiresAt).toLocaleString() }}
			</span>
		</div>
		<MkButton danger @click="clearStatus">
			<i class="ti ti-x"></i> {{ i18n.ts._customStatus.clearStatus }}
		</MkButton>
	</FormSection>

	<!-- ステータス設定フォーム -->
	<FormSection>
		<template #label>{{ i18n.ts._customStatus.setStatus }}</template>
		<div class="_gaps_s">
			<div style="display: flex; gap: 8px; align-items: flex-end;">
				<MkInput v-model="emoji" style="width: 80px;" placeholder="😊">
					<template #label>{{ i18n.ts._customStatus.statusEmoji }}</template>
				</MkInput>
				<MkInput v-model="text" style="flex: 1;" :placeholder="i18n.ts._customStatus.statusText">
					<template #label>{{ i18n.ts._customStatus.statusText }}</template>
				</MkInput>
			</div>

			<!-- プリセット -->
			<div style="display: flex; flex-wrap: wrap; gap: 6px;">
				<button
					v-for="preset in presets"
					:key="preset.text"
					:class="$style.presetBtn"
					@click="applyPreset(preset)"
				>
					{{ preset.emoji }} {{ preset.text }}
				</button>
			</div>

			<MkInput v-model="expiresAt" type="datetime-local">
				<template #label>{{ i18n.ts._customStatus.expiresAt }}</template>
			</MkInput>

			<MkButton primary :disabled="!text.trim()" @click="setStatus">
				<i class="ti ti-check"></i> {{ i18n.ts._customStatus.setStatus }}
			</MkButton>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { $i } from '@/account.js';
import { reloadCurrentAccountIfGuest } from '@/accounts.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import FormSection from '@/components/form/section.vue';
import { definePage } from '@/page.js';

type Status = { emoji: string | null; text: string; expiresAt: string | null } | null;

const emoji = ref('');
const text = ref('');
const expiresAt = ref('');
const currentStatus = ref<Status>(null);

const presets = [
	{ emoji: '💻', text: '作業中' },
	{ emoji: '🎮', text: 'ゲーム中' },
	{ emoji: '😴', text: '寝てます' },
	{ emoji: '🍜', text: 'ごはん中' },
	{ emoji: '📖', text: '読書中' },
	{ emoji: '🎵', text: '音楽鑑賞中' },
	{ emoji: '🚂', text: '移動中' },
	{ emoji: '🤔', text: '考え中' },
];

function applyPreset(preset: { emoji: string; text: string }) {
	emoji.value = preset.emoji;
	text.value = preset.text;
}

async function loadCurrentStatus() {
	// $i にstatus情報が含まれるはず
	const user = $i;
	if (user && (user as any).status) {
		currentStatus.value = (user as any).status;
	} else {
		currentStatus.value = null;
	}
}

async function setStatus() {
	await os.apiWithDialog('i/update-status', {
		statusEmoji: emoji.value.trim() || null,
		statusText: text.value.trim() || null,
		statusExpiresAt: expiresAt.value ? new Date(expiresAt.value).toISOString() : null,
	});
	currentStatus.value = {
		emoji: emoji.value.trim() || null,
		text: text.value.trim(),
		expiresAt: expiresAt.value ? new Date(expiresAt.value).toISOString() : null,
	};
	emoji.value = '';
	text.value = '';
	expiresAt.value = '';
}

async function clearStatus() {
	await os.apiWithDialog('i/update-status', {
		statusEmoji: null,
		statusText: null,
		statusExpiresAt: null,
	});
	currentStatus.value = null;
}

onMounted(loadCurrentStatus);

definePage(() => ({
	title: i18n.ts.customStatus,
	icon: 'ti ti-mood-happy',
}));
</script>

<style lang="scss" module>
.presetBtn {
	background: var(--MI_THEME-buttonBg);
	border: none;
	border-radius: 999px;
	padding: 4px 12px;
	font-size: 0.85em;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}
</style>
