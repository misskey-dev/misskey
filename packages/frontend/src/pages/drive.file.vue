<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
	</template>

	<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
		<MkSpacer v-if="tab === 'info'" key="info" :contentMax="800">
			<XFileInfo :fileId="fileId"/>
		</MkSpacer>

		<MkSpacer v-else-if="tab === 'notes'" key="notes" :contentMax="800">
			<XNotes :fileId="fileId"/>
		</MkSpacer>
	</MkHorizontalSwipe>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';

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

definePageMetadata(() => ({
	title: i18n.ts._fileViewer.title,
	icon: 'ti ti-file',
}));
</script>
