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
		{{ multiple ? i18n.ts.selectFolders : i18n.ts.selectFolder }}
		<span v-if="multiple && selected.length > 0" style="margin-left: 8px; opacity: 0.5;">({{ selected.length }})</span>
	</template>
	<MkDrive :multiple="multiple" select="folder" :initialFolder="initialFolder" @changeSelectedFolders="onChangeSelection"/>
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
	multiple?: boolean;
}>(), {
	initialFolder: null,
	multiple: false,
});

const emit = defineEmits<{
	(ev: 'done', r?: (Misskey.entities.DriveFolder | null)[]): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const selected = ref<(Misskey.entities.DriveFolder | null)[]>([]);

function ok() {
	emit('done', selected.value);
	dialog.value?.close();
}

function cancel() {
	emit('done');
	dialog.value?.close();
}

function onChangeSelection(v: (Misskey.entities.DriveFolder | null)[]) {
	selected.value = v;
}
</script>
