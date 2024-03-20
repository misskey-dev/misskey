<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<div class="inputs" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
				<MkSelect v-model="origin" style="margin: 0; flex: 1;">
					<template #label>{{ i18n.ts.instance }}</template>
					<option value="combined">{{ i18n.ts.all }}</option>
					<option value="local">{{ i18n.ts.local }}</option>
					<option value="remote">{{ i18n.ts.remote }}</option>
				</MkSelect>
				<MkInput v-model="searchHost" :debounce="true" type="search" style="margin: 0; flex: 1;">
					<template #label>{{ i18n.ts.host }}</template>
				</MkInput>
			</div>
			<div class="inputs" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
				<MkInput v-model="userId" :debounce="true" type="search" style="margin: 0; flex: 1;">
					<template #label>User ID</template>
				</MkInput>
				<MkInput v-model="type" :debounce="true" type="search" style="margin: 0; flex: 1;">
					<template #label>MIME type</template>
				</MkInput>
			</div>
			<MkFileListForAdmin :pagination="pagination" :viewMode="viewMode"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkFileListForAdmin from '@/components/MkFileListForAdmin.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const origin = ref<'local' | 'remote' | 'combined'>('local');
const type = ref<string | null>(null);
const searchHost = ref('');
const userId = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const pagination = {
	endpoint: 'admin/drive/files' as const,
	limit: 10,
	params: computed(() => ({
		type: (type.value && type.value !== '') ? type.value : null,
		userId: (userId.value && userId.value !== '') ? userId.value : null,
		origin: origin.value,
		hostname: (searchHost.value && searchHost.value !== '') ? searchHost.value : null,
	})),
};

function clear() {
	os.confirm({
		type: 'warning',
		text: i18n.ts.clearCachedFilesConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog('admin/drive/clean-remote-files', {});
	});
}

function show(file) {
	os.pageWindow(`/admin/file/${file.id}`);
}

async function find() {
	const { canceled, result: q } = await os.inputText({
		title: i18n.ts.fileIdOrUrl,
		minLength: 1,
	});
	if (canceled) return;

	misskeyApi('admin/drive/show-file', q.startsWith('http://') || q.startsWith('https://') ? { url: q.trim() } : { fileId: q.trim() }).then(file => {
		show(file);
	}).catch(err => {
		if (err.code === 'NO_SUCH_FILE') {
			os.alert({
				type: 'error',
				text: i18n.ts.notFound,
			});
		}
	});
}

const headerActions = computed(() => [{
	text: i18n.ts.lookup,
	icon: 'ti ti-search',
	handler: find,
}, {
	text: i18n.ts.clearCachedFiles,
	icon: 'ti ti-trash',
	handler: clear,
}]);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.files,
	icon: 'ti ti-cloud',
}));
</script>
