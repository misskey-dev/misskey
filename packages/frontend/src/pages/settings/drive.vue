<template>
<div class="_gaps_m">
	<FormSection v-if="!fetching" first>
		<template #label>{{ i18n.ts.usageAmount }}</template>

		<div class="_gaps_m">
			<div class="uawsfosz">
				<div class="meter"><div :style="meterStyle"></div></div>
			</div>
			<FormSplit>
				<MkKeyValue>
					<template #key>{{ i18n.ts.capacity }}</template>
					<template #value>{{ bytes(capacity, 1) }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.inUse }}</template>
					<template #value>{{ bytes(usage, 1) }}</template>
				</MkKeyValue>
			</FormSplit>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.statistics }}</template>
		<MkChart src="per-user-drive" :args="{ user: $i }" span="day" :limit="7 * 5" :bar="true" :stacked="true" :detailed="false" :aspect-ratio="6"/>
	</FormSection>

	<FormSection>
		<div class="_gaps_m">
			<FormLink @click="chooseUploadFolder()">
				{{ i18n.ts.uploadFolder }}
				<template #suffix>{{ uploadFolder ? uploadFolder.name : '-' }}</template>
				<template #suffixIcon><i class="ti ti-folder"></i></template>
			</FormLink>
			<FormLink to="/settings/drive/cleaner">
				{{ i18n.ts.drivecleaner }}
			</FormLink>
			<MkSwitch v-model="keepOriginalUploading">
				<template #label>{{ i18n.ts.keepOriginalUploading }}</template>
				<template #caption>{{ i18n.ts.keepOriginalUploadingDescription }}</template>
			</MkSwitch>
			<MkSwitch v-model="alwaysMarkNsfw" @update:model-value="saveProfile()">
				<template #label>{{ i18n.ts.alwaysMarkSensitive }}</template>
			</MkSwitch>
			<MkSwitch v-model="autoSensitive" @update:model-value="saveProfile()">
				<template #label>{{ i18n.ts.enableAutoSensitive }}<span class="_beta">{{ i18n.ts.beta }}</span></template>
				<template #caption>{{ i18n.ts.enableAutoSensitiveDescription }}</template>
			</MkSwitch>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import tinycolor from 'tinycolor2';
import FormLink from '@/components/form/link.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os';
import bytes from '@/filters/bytes';
import { defaultStore } from '@/store';
import MkChart from '@/components/MkChart.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';

const fetching = ref(true);
const usage = ref<any>(null);
const capacity = ref<any>(null);
const uploadFolder = ref<any>(null);
let alwaysMarkNsfw = $ref($i.alwaysMarkNsfw);
let autoSensitive = $ref($i.autoSensitive);

const meterStyle = computed(() => {
	return {
		width: `${usage.value / capacity.value * 100}%`,
		background: tinycolor({
			h: 180 - (usage.value / capacity.value * 180),
			s: 0.7,
			l: 0.5,
		}),
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
		folderId: defaultStore.state.uploadFolder,
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
				folderId: defaultStore.state.uploadFolder,
			});
		} else {
			uploadFolder.value = null;
		}
	});
}

function saveProfile() {
	os.api('i/update', {
		alwaysMarkNsfw: !!alwaysMarkNsfw,
		autoSensitive: !!autoSensitive,
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.drive,
	icon: 'ti ti-cloud',
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
