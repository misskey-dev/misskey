<template>
<MkFolder defaultOpen :withSpacer="false">
	<template #label>{{ data.split('\n')[0] }}</template>
	<template #header>
		<MkTabs
			v-model:tab="tab"
			:tabs="[{
				key: 'raw',
				title: 'Raw',
			}, {
				key: 'mfm',
				title: 'MFM',
			}]"
		/>
	</template>

	<div v-show="tab === 'raw'" class="_spacer" style="--MI_SPACER-min: 14px; --MI_SPACER-max: 22px;">
		<MkCode :code="data" lang="text"/>
	</div>
	<div v-show="tab === 'mfm'" class="_gaps _spacer">
		<Mfm :text="data" :nyaize="false"/>
		<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="false"/>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { defineProps, ref, computed } from 'vue';
import * as mfm from 'mfm-js';
import MkFolder from '@/components/MkFolder.vue';
import MkTabs from '@/components/MkTabs.vue';
import { extractUrlFromMfm } from '@/utility/extract-url-from-mfm';
import MkCode from '@/components/MkCode.vue';
import MkUrlPreview from '@/components/MkUrlPreview.vue';

const props = defineProps<{
	data: string;
}>();

const tab = ref<'mfm' | 'raw'>('raw');
const parsed = computed(() => mfm.parse(props.data));
const urls = computed(() => extractUrlFromMfm(parsed.value));
</script>
