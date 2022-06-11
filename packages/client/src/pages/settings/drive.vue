<template>
<div class="_formRoot">
	<FormSection v-if="!fetching">
		<template #label>{{ i18n.ts.usageAmount }}</template>
		<div class="_formBlock uawsfosz">
			<div class="meter"><div :style="meterStyle"></div></div>
		</div>
		<FormSplit>
			<MkKeyValue class="_formBlock">
				<template #key>{{ i18n.ts.capacity }}</template>
				<template #value>{{ bytes(capacity, 1) }}</template>
			</MkKeyValue>
			<MkKeyValue class="_formBlock">
				<template #key>{{ i18n.ts.inUse }}</template>
				<template #value>{{ bytes(usage, 1) }}</template>
			</MkKeyValue>
		</FormSplit>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.statistics }}</template>
		<MkChart src="per-user-drive" :args="{ user: $i }" span="day" :limit="7 * 5" :bar="true" :stacked="true" :detailed="false" :aspect-ratio="6"/>
	</FormSection>

	<FormSection>
		<FormLink @click="chooseUploadFolder()">
			{{ i18n.ts.uploadFolder }}
			<template #suffix>{{ uploadFolder ? uploadFolder.name : '-' }}</template>
			<template #suffixIcon><i class="fas fa-folder-open"></i></template>
		</FormLink>
		<FormSwitch v-model="keepOriginalUploading" class="_formBlock">{{ i18n.ts.keepOriginalUploading }}<template #caption>{{ i18n.ts.keepOriginalUploadingDescription }}</template></FormSwitch>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { computed, defineExpose, ref } from 'vue';
import tinycolor from 'tinycolor2';
import FormLink from '@/components/form/link.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/key-value.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os';
import bytes from '@/filters/bytes';
import * as symbols from '@/symbols';
import { defaultStore } from '@/store';
import MkChart from '@/components/chart.vue';
import { i18n } from '@/i18n';

const fetching = ref(true);
const usage = ref<any>(null);
const capacity = ref<any>(null);
const uploadFolder = ref<any>(null);

const meterStyle = computed(() => {
	return {
		width: `${usage.value / capacity.value * 100}%`,
		background: tinycolor({
			h: 180 - (usage.value / capacity.value * 180),
			s: 0.7,
			l: 0.5
		})
	};
});

const keepOriginalUploading = computed(defaultStore.makeGetterSetter('keepOriginalUploading'));

os.api('drive').then(info => {
	capacity.value = info.capacity;
	usage.value = info.usage;
	fetching.value = false;
});

if (defaultStore.state.uploadFolder) {
	os.api('drive/folders/show', {
		folderId: defaultStore.state.uploadFolder
	}).then(response => {
		uploadFolder.value = response;
	});
}

function chooseUploadFolder() {
	os.selectDriveFolder(false).then(async folder => {
		defaultStore.set('uploadFolder', folder ? folder.id : null);
		os.success();
		if (defaultStore.state.uploadFolder) {
			uploadFolder.value = await os.api('drive/folders/show', {
				folderId: defaultStore.state.uploadFolder
			});
		} else {
			uploadFolder.value = null;
		}
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.drive,
		icon: 'fas fa-cloud',
		bg: 'var(--bg)',
	}
});
</script>

<style lang="scss" scoped>

@use "sass:math";

.uawsfosz {

	> .meter {
		$size: 12px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: math.div($size, 2);
		overflow: hidden;

		> div {
			height: $size;
			border-radius: math.div($size, 2);
		}
	}
}
</style>
