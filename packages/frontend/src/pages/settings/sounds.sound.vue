<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="type">
		<template #label>{{ i18n.ts.sound }}</template>
		<option v-for="x in soundsTypes" :key="x ?? 'null'" :value="x">{{ getFileName(x) }}</option>
	</MkSelect>
	<div v-if="type === 'driveFile'" :class="$style.fileSelectorRoot">
		<MkButton inline rounded primary @click="selectSound">{{ i18n.ts.selectFile }}</MkButton>
		<div :class="!fileUrl && $style.fileNotSelected">{{ fileName === '' ? i18n.ts._soundSettings.driveFileWarn : fileName }}</div>
	</div>
	<MkRange v-model="volume" :min="0" :max="1" :step="0.05" :textConverter="(v) => `${Math.floor(v * 100)}%`">
		<template #label>{{ i18n.ts.volume }}</template>
	</MkRange>

	<div class="_buttons">
		<MkButton inline @click="listen"><i class="ti ti-player-play"></i> {{ i18n.ts.listen }}</MkButton>
		<MkButton inline primary @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { SoundType } from '@/scripts/sound.js';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkRange from '@/components/MkRange.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { playFile, soundsTypes, getSoundDuration } from '@/scripts/sound.js';
import { selectFile } from '@/scripts/select-file.js';

const props = defineProps<{
	type: SoundType;
	fileId?: string;
	fileUrl?: string;
	volume: number;
}>();

const emit = defineEmits<{
	(ev: 'update', result: { type: SoundType; fileId?: string; fileUrl?: string; volume: number; }): void;
}>();

const type = ref<SoundType>(props.type);
const fileId = ref(props.fileId);
const fileUrl = ref(props.fileUrl);
const fileName = ref<string>('');
const volume = ref(props.volume);

if (type.value === 'driveFile' && fileId.value) {
	const apiRes = await os.api('drive/files/show', {
		fileId: fileId.value,
	});
	fileName.value = apiRes.name;
}

function getFileName(f: SoundType): string {
	switch (f) {
		case null:
			return i18n.ts.none;
		case 'driveFile':
			return i18n.ts._soundSettings.driveFile;
		default:
			return f;
	}
}

function selectSound(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts._soundSettings.driveFile).then(async (file) => {
		if (!file.type.startsWith('audio')) {
			os.alert({
				type: 'warning',
				title: i18n.ts._soundSettings.driveFileTypeWarn,
				text: i18n.ts._soundSettings.driveFileTypeWarnDescription,
			});
			return;
		}
		const duration = await getSoundDuration(file.url);
		if (duration >= 2000) {
			const { canceled } = await os.confirm({
				type: 'warning',
				title: i18n.ts._soundSettings.driveFileDurationWarn,
				text: i18n.ts._soundSettings.driveFileDurationWarnDescription,
				okText: i18n.ts.continue,
				cancelText: i18n.ts.cancel,
			});
			if (canceled) return;
		}

		fileUrl.value = file.url;
		fileName.value = file.name;
		fileId.value = file.id;
	});
}

function listen() {
	if (type.value === 'driveFile' && !fileUrl.value) {
		os.alert({
			type: 'warning',
			text: i18n.ts._soundSettings.driveFileWarn,
		});
		return;
	}

	playFile({
		soundType: type.value,
		fileUrl: fileUrl.value,
		fileId: fileId.value,
		volume: volume.value,
	});
}

function save() {
	if (type.value === 'driveFile' && !fileUrl.value) {
		os.alert({
			type: 'warning',
			text: i18n.ts._soundSettings.driveFileWarn,
		});
		return;
	}

	if (type.value !== 'driveFile') {
		fileUrl.value = undefined;
		fileName.value = '';
		fileId.value = undefined;
	}

	emit('update', {
		type: type.value,
		fileId: fileId.value,
		fileUrl: fileUrl.value,
		volume: volume.value,
	});
}
</script>

<style module>
.fileSelectorRoot {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.fileNotSelected {
	font-weight: 700;
	color: var(--infoWarnFg);
}
</style>
