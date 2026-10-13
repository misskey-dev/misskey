<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<div class="_buttons">
		<MkButton :disabled="logs.length === 0" @click="copy(logs)">{{ i18n.ts._clientErrorLog.copyAll }}</MkButton>
		<MkButton danger :disabled="logs.length === 0" @click="clear">{{ i18n.ts._clientErrorLog.deleteAll }}</MkButton>
	</div>
	<article v-for="(log, index) in logs" :key="`${log.date}:${index}`" class="_panel _gaps_s" :class="$style.entry">
		<div :class="$style.meta">
			<MkTime :time="log.date" mode="detail"/>
			<span :class="$style.type">{{ log.type }}</span>
		</div>
		<div :class="$style.message" class="_selectable">{{ log.message }}</div>
		<MkFolder :canPage="false">
			<template #label>{{ i18n.ts.details }}</template>
			<pre :class="$style.log" class="_selectable">{{ log.stack }}</pre>
			<div>{{ i18n.ts.version }} {{ log.version }}</div>
		</MkFolder>
		<MkButton @click="copy([log])"><i class="ti ti-copy"></i> {{ i18n.ts.copy }}</MkButton>
	</article>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { ClientErrorLog } from '@/error-log.js';
import { clientErrorLogs, loadClientErrorLogs, clearClientErrorLogs } from '@/error-log.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

loadClientErrorLogs();
const logs = computed(() => [...clientErrorLogs.value].reverse());

async function copy(entries: ClientErrorLog[]): Promise<void> {
	try {
		await navigator.clipboard.writeText(JSON.stringify(entries, null, 2));
		os.toast(i18n.ts.copiedToClipboard);
	} catch {
		await os.alert({ type: 'error', text: i18n.ts.error });
	}
}

async function clear(): Promise<void> {
	const { canceled } = await os.confirm({ type: 'warning', text: i18n.ts._clientErrorLog.deleteConfirm });
	if (canceled) return;
	if (!clearClientErrorLogs()) await os.alert({ type: 'error', text: i18n.ts.error });
}
</script>

<style lang="scss" module>
.entry {
	padding: var(--MI-margin);
}

.meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	font-size: 85%;
	color: var(--MI_THEME-fgTransparentWeak);
}

.type {
	padding: 2px 8px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fg);
}

.message {
	font-weight: bold;
	overflow-wrap: anywhere;
	white-space: pre-wrap;
}

.log {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	max-height: 300px;
	overflow: auto;
}
</style>
