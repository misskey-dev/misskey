<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSuspense v-slot="{ result }" :p="_fetch_" @resolved="(result) => file = result.file">
	<XRoot v-if="result.file != null && result.info != null" :file="result.file" :info="result.info"/>
</MkSuspense>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XRoot from './admin-file.root.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';

const props = defineProps<{
	fileId: string,
}>();

function _fetch_() {
	return Promise.all([
		misskeyApi('drive/files/show', { fileId: props.fileId }),
		misskeyApi('admin/drive/show-file', { fileId: props.fileId }),
	]).then((result) => ({
		file: result[0],
		info: result[1],
	}));
}

const file = ref<Misskey.entities.DriveFile | null>(null);

definePage(() => ({
	title: file.value ? `${i18n.ts.file}: ${file.value.name}` : i18n.ts.file,
	icon: 'ti ti-file',
}));
</script>
