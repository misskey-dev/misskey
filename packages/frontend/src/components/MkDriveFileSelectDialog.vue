<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="800"
	:height="500"
	:withOkButton="true"
	:okButtonDisabled="selected.length === 0"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="emit('closed')"
>
	<template #header>
		{{ multiple ? i18n.ts.selectFiles : i18n.ts.selectFile }}
		<span v-if="selected.length > 0" style="margin-left: 8px; opacity: 0.5;">({{ selected.length }})</span>
	</template>
	<MkDrive :multiple="multiple" select="file" :initialFolder="initialFolder" @changeSelectedFiles="onChangeSelection"/>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkDrive from '@/components/MkDrive.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';

withDefaults(defineProps<{
	initialFolder?: Misskey.entities.DriveFolder['id'] | null;
	multiple: boolean;
}>(), {
});

const emit = defineEmits<{
	(ev: 'done', r?: Misskey.entities.DriveFile[]): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const selected = ref<Misskey.entities.DriveFile[]>([]);

function ok() {
	emit('done', selected.value);
	dialog.value?.close();
}

function cancel() {
	emit('done');
	dialog.value?.close();
}

function onChangeSelection(v: Misskey.entities.DriveFile[]) {
	selected.value = v;
}
</script>
