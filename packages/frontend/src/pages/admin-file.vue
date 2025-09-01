<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XRoot v-if="file != null && info != null" :file="file" :info="info"/>
<div v-else-if="error != null">Error: {{ error }}</div>
<MkLoading v-else/>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XRoot from './admin-file.root.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';

const file = ref<Misskey.entities.DriveFile | null>(null);
const info = ref<Misskey.entities.AdminDriveShowFileResponse | null>(null);

const error = ref<string | null>(null);

const props = defineProps<{
	fileId: string,
}>();

async function _fetch_() {
	try {
		file.value = await misskeyApi('drive/files/show', { fileId: props.fileId });
	} catch (err: any) {
		error.value = err.message + ' ' + err.id;
		return;
	}

	info.value = await misskeyApi('admin/drive/show-file', { fileId: props.fileId });
}

_fetch_();

definePage(() => ({
	title: file.value ? `${i18n.ts.file}: ${file.value.name}` : i18n.ts.file,
	icon: 'ti ti-file',
}));
</script>
