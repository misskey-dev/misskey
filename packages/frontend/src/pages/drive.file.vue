<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
	</template>

	<MkSwiper v-model:tab="tab" :tabs="headerTabs">
		<div v-if="tab === 'info'" class="_spacer" style="--MI_SPACER-w: 800px;">
			<XFileInfo :fileId="fileId"/>
		</div>

		<div v-else-if="tab === 'notes'" class="_spacer" style="--MI_SPACER-w: 800px;">
			<XNotes :fileId="fileId"/>
		</div>
	</MkSwiper>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkSwiper from '@/components/MkSwiper.vue';

const props = defineProps<{
	fileId: string;
}>();

const XFileInfo = defineAsyncComponent(() => import('./drive.file.info.vue'));
const XNotes = defineAsyncComponent(() => import('./drive.file.notes.vue'));

const tab = ref('info');

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'info',
	title: i18n.ts.info,
	icon: 'ti ti-info-circle',
}, {
	key: 'notes',
	title: i18n.ts._fileViewer.attachedNotes,
	icon: 'ti ti-pencil',
}]);

definePage(() => ({
	title: i18n.ts._fileViewer.title,
	icon: 'ti ti-file',
}));
</script>
