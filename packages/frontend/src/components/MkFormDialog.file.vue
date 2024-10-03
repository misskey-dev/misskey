<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkButton inline rounded primary @click="selectButton($event)">{{ i18n.ts.selectFile }}</MkButton>
	<div :class="['_nowrap', !fileName && $style.fileNotSelected]">{{ friendlyFileName }}</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { computed, ref } from 'vue';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import { selectFile } from '@/scripts/select-file.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const props = defineProps<{
	fileId?: string | null;
	validate?: (file: Misskey.entities.DriveFile) => Promise<boolean>;
}>();

const emit = defineEmits<{
	(ev: 'update', result: Misskey.entities.DriveFile): void;
}>();

const fileUrl = ref('');
const fileName = ref<string>('');

const friendlyFileName = computed<string>(() => {
	if (fileName.value) {
		return fileName.value;
	}
	if (fileUrl.value) {
		return fileUrl.value;
	}

	return i18n.ts.fileNotSelected;
});

if (props.fileId) {
	misskeyApi('drive/files/show', {
		fileId: props.fileId,
	}).then((apiRes) => {
		fileName.value = apiRes.name;
		fileUrl.value = apiRes.url;
	});
}

function selectButton(ev: MouseEvent) {
	selectFile(ev.currentTarget ?? ev.target).then(async (file) => {
		if (!file) return;
		if (props.validate && !await props.validate(file)) return;

		emit('update', file);
		fileName.value = file.name;
		fileUrl.value = file.url;
	});
}

</script>

<style module>
.fileNotSelected {
	font-weight: 700;
	color: var(--infoWarnFg);
}
</style>
