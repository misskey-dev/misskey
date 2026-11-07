<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder defaultOpen :withSpacer="false">
	<template #label>{{ data.split('\n')[0] }}</template>
	<template #header>
		<MkTabs
			v-model:tab="tab"
			:tabs="[
				{
					key: 'mfm',
					title: i18n.ts._qr.mfm,
					icon: 'ti ti-align-left',
				},
				{
					key: 'raw',
					title: i18n.ts._qr.raw,
					icon: 'ti ti-code',
				},
			]"
		/>
	</template>

	<div v-show="tab === 'mfm'" class="_spacer _gaps">
		<Mfm :text="data" :nyaize="false"/>
		<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="false"/>
	</div>
	<div v-show="tab === 'raw'" class="_spacer" style="--MI_SPACER-min: 10px; --MI_SPACER-max: 16px;">
		<MkCode :code="data" lang="text"/>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as mfm from 'mfm-js';
import MkFolder from '@/components/MkFolder.vue';
import MkTabs from '@/components/MkTabs.vue';
import { extractUrlFromMfm } from '@/utility/extract-url-from-mfm';
import MkCode from '@/components/MkCode.vue';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	data: string;
}>();

const parsed = computed(() => mfm.parse(props.data));
const urls = computed(() => extractUrlFromMfm(parsed.value));
const tab = ref<'mfm' | 'raw'>('mfm');
</script>
