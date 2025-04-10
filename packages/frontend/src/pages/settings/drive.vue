<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/drive" :label="i18n.ts.drive" :keywords="['drive']" icon="ti ti-cloud">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/cloud_3d.png" color="#0059ff">
			<SearchKeyword>{{ i18n.ts._settings.driveBanner }}</SearchKeyword>
		</MkFeatureBanner>

		<SearchMarker :keywords="['capacity', 'usage']">
			<FormSection first>
				<template #label><SearchLabel>{{ i18n.ts.usageAmount }}</SearchLabel></template>

				<div v-if="!fetching" class="_gaps_m">
					<div>
						<div :class="$style.meter"><div :class="$style.meterValue" :style="meterStyle"></div></div>
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
		</SearchMarker>

		<SearchMarker :keywords="['statistics', 'usage']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.statistics }}</SearchLabel></template>
				<MkChart src="per-user-drive" :args="{ user: $i }" span="day" :limit="7 * 5" :bar="true" :stacked="true" :detailed="false" :aspectRatio="6"/>
			</FormSection>
		</SearchMarker>

		<FormSection>
			<div class="_gaps_m">
				<SearchMarker :keywords="['default', 'upload', 'folder']">
					<FormLink @click="chooseUploadFolder()">
						<SearchLabel>{{ i18n.ts.uploadFolder }}</SearchLabel>
						<template #suffix>{{ uploadFolder ? uploadFolder.name : '-' }}</template>
						<template #suffixIcon><i class="ti ti-folder"></i></template>
					</FormLink>
				</SearchMarker>

				<FormLink to="/settings/drive/cleaner">
					{{ i18n.ts.drivecleaner }}
				</FormLink>

				<SearchMarker :keywords="['keep', 'original', 'raw', 'upload']">
					<MkPreferenceContainer k="keepOriginalUploading">
						<MkSwitch v-model="keepOriginalUploading">
							<template #label><SearchLabel>{{ i18n.ts.keepOriginalUploading }}</SearchLabel></template>
							<template #caption><SearchKeyword>{{ i18n.ts.keepOriginalUploadingDescription }}</SearchKeyword></template>
						</MkSwitch>
					</MkPreferenceContainer>
				</SearchMarker>

				<SearchMarker :keywords="['keep', 'original', 'filename']">
					<MkPreferenceContainer k="keepOriginalFilename">
						<MkSwitch v-model="keepOriginalFilename">
							<template #label><SearchLabel>{{ i18n.ts.keepOriginalFilename }}</SearchLabel></template>
							<template #caption><SearchKeyword>{{ i18n.ts.keepOriginalFilenameDescription }}</SearchKeyword></template>
						</MkSwitch>
					</MkPreferenceContainer>
				</SearchMarker>

				<SearchMarker :keywords="['image', 'compress', 'resize', 'lossly']">
					<MkFolder :defaultOpen="true">
						<template #icon><i class="ti ti-photo"></i></template>
						<template #label><SearchLabel>{{ i18n.ts._imageCompressionMode.title }}</SearchLabel></template>
						<template #caption><SearchKeyword>{{ i18n.ts._imageCompressionMode.description }}</SearchKeyword></template>

						<div class="_gaps">
							<MkSwitch v-model="imageResize">
								<template #label><SearchKeyword>{{ i18n.ts._imageCompressionMode.imageResize }}</SearchKeyword></template>
								<template #caption>{{ i18n.ts._imageCompressionMode.imageResizeDescription }}</template>
							</MkSwitch>
							<MkSelect
								v-model="imageResizeSize"
								:items="[
									{value: 2048, label: i18n.ts._imageCompressionMode._imageResizeSize.max2048},
									{value: 2560, label: i18n.ts._imageCompressionMode._imageResizeSize.max2560},
									{value: 4096, label: i18n.ts._imageCompressionMode._imageResizeSize.max4096},
									{value: 8192, label: i18n.ts._imageCompressionMode._imageResizeSize.max8192},
								]"
							>
								<template #label><SearchKeyword>{{ i18n.ts._imageCompressionMode._imageResizeSize.title }}</SearchKeyword></template>
							</MkSelect>
							<MkSwitch v-model="imageCompressionLossy">
								<template #label><SearchKeyword>{{ i18n.ts._imageCompressionMode.imageCompressionLossy }}</SearchKeyword></template>
								<template #caption>{{ i18n.ts._imageCompressionMode.imageCompressionLossyDescription }}</template>
							</MkSwitch>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['always', 'default', 'mark', 'nsfw', 'sensitive', 'media', 'file']">
					<MkSwitch v-model="alwaysMarkNsfw" @update:modelValue="saveProfile()">
						<template #label><SearchLabel>{{ i18n.ts.alwaysMarkSensitive }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['auto', 'nsfw', 'sensitive', 'media', 'file']">
					<MkSwitch v-model="autoSensitive" @update:modelValue="saveProfile()">
						<template #label><SearchLabel>{{ i18n.ts.enableAutoSensitive }}</SearchLabel><span class="_beta">{{ i18n.ts.beta }}</span></template>
						<template #caption><SearchKeyword>{{ i18n.ts.enableAutoSensitiveDescription }}</SearchKeyword></template>
					</MkSwitch>
				</SearchMarker>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import tinycolor from 'tinycolor2';
import FormLink from '@/components/form/link.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkFolder from '@/components/MkFolder.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import bytes from '@/filters/bytes.js';
import MkChart from '@/components/MkChart.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { ensureSignin } from '@/i.js';
import { prefer } from '@/preferences.js';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';

const $i = ensureSignin();

const fetching = ref(true);
const usage = ref<number | null>(null);
const capacity = ref<number | null>(null);
const uploadFolder = ref<Misskey.entities.DriveFolder | null>(null);
const alwaysMarkNsfw = ref($i.alwaysMarkNsfw);
const autoSensitive = ref($i.autoSensitive);

const meterStyle = computed(() => {
	if (!capacity.value || !usage.value) return {};
	return {
		width: `${usage.value / capacity.value * 100}%`,
		background: tinycolor({
			h: 180 - (usage.value / capacity.value * 180),
			s: 0.7,
			l: 0.5,
		}).toHslString(),
	};
});

const keepOriginalUploading = prefer.model('keepOriginalUploading');
const keepOriginalFilename = prefer.model('keepOriginalFilename');
const imageCompressionMode = prefer.model('imageCompressionMode');
const imageResize = ref(imageCompressionMode.value.startsWith('resize'));
const imageCompressionLossy = ref(imageCompressionMode.value.endsWith('CompressLossy'));
const imageResizeSize = prefer.model('imageResizeSize');

watch([imageResize, imageCompressionLossy], ([imageResizeValue, imageCompressionLossyValue]) => {
	const resizeMode: 'resize' | 'noResize' = imageResizeValue ? 'resize' : 'noResize';
	const compressionMode: 'CompressLossy' | 'Compress' = imageCompressionLossyValue ? 'CompressLossy' : 'Compress';
	imageCompressionMode.value = resizeMode + compressionMode;
});

misskeyApi('drive').then(info => {
	capacity.value = info.capacity;
	usage.value = info.usage;
	fetching.value = false;
});

if (prefer.s.uploadFolder) {
	misskeyApi('drive/folders/show', {
		folderId: prefer.s.uploadFolder,
	}).then(response => {
		uploadFolder.value = response;
	});
}

function chooseUploadFolder() {
	os.selectDriveFolder(false).then(async folder => {
		prefer.commit('uploadFolder', folder[0] ? folder[0].id : null);
		os.success();
		if (prefer.s.uploadFolder) {
			uploadFolder.value = await misskeyApi('drive/folders/show', {
				folderId: prefer.s.uploadFolder,
			});
		} else {
			uploadFolder.value = null;
		}
	});
}

function saveProfile() {
	misskeyApi('i/update', {
		alwaysMarkNsfw: !!alwaysMarkNsfw.value,
		autoSensitive: !!autoSensitive.value,
	}).catch(err => {
		os.alert({
			type: 'error',
			title: i18n.ts.error,
			text: err.message,
		});
		alwaysMarkNsfw.value = true;
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.drive,
	icon: 'ti ti-cloud',
}));
</script>

<style lang="scss" module>
.meter {
	height: 10px;
	background: rgba(0, 0, 0, 0.1);
	border-radius: 999px;
	overflow: clip;
}

.meterValue {
	height: 100%;
	border-radius: 999px;
}
</style>
