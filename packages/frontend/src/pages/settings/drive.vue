<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/drive" :label="i18n.ts.drive" :keywords="['drive']" icon="ti ti-cloud">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/cloud_3d.png" color="#0059ff">
			<SearchText>{{ i18n.ts._settings.driveBanner }}</SearchText>
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

		<SearchMarker :keywords="['general']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.general }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['default', 'upload', 'folder']">
						<FormLink @click="chooseUploadFolder()">
							<SearchLabel>{{ i18n.ts.uploadFolder }}</SearchLabel>
							<template #suffix>{{ uploadFolder ? uploadFolder.name : '-' }}</template>
							<template #icon><i class="ti ti-folder"></i></template>
						</FormLink>
					</SearchMarker>

					<FormLink to="/settings/drive/cleaner">
						{{ i18n.ts.drivecleaner }}
					</FormLink>

					<SearchMarker :keywords="['keep', 'original', 'filename']">
						<MkPreferenceContainer k="keepOriginalFilename">
							<MkSwitch v-model="keepOriginalFilename">
								<template #label><SearchLabel>{{ i18n.ts.keepOriginalFilename }}</SearchLabel></template>
								<template #caption><SearchText>{{ i18n.ts.keepOriginalFilenameDescription }}</SearchText></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['always', 'default', 'mark', 'nsfw', 'sensitive', 'media', 'file']">
						<MkSwitch v-model="alwaysMarkNsfw" @update:modelValue="saveProfile()">
							<template #label><SearchLabel>{{ i18n.ts.alwaysMarkSensitive }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['auto', 'nsfw', 'sensitive', 'media', 'file']">
						<MkSwitch v-model="autoSensitive" @update:modelValue="saveProfile()">
							<template #label><SearchLabel>{{ i18n.ts.enableAutoSensitive }}</SearchLabel><span class="_beta">{{ i18n.ts.beta }}</span></template>
							<template #caption><SearchText>{{ i18n.ts.enableAutoSensitiveDescription }}</SearchText></template>
						</MkSwitch>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['image']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.image }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['watermark', 'credit']">
						<MkFolder v-if="$i.policies.watermarkAvailable">
							<template #icon><i class="ti ti-copyright"></i></template>
							<template #label><SearchLabel>{{ i18n.ts.watermark }}</SearchLabel></template>
							<template #caption>{{ i18n.ts._watermarkEditor.tip }}</template>

							<div class="_gaps">
								<div class="_gaps_s">
									<XWatermarkItem
										v-for="(preset, i) in prefer.r.watermarkPresets.value"
										:key="preset.id"
										:preset="preset"
										@updatePreset="onUpdateWatermarkPreset(preset.id, $event)"
										@del="onDeleteWatermarkPreset(preset.id)"
									/>

									<MkButton iconOnly rounded style="margin: 0 auto;" @click="addWatermarkPreset"><i class="ti ti-plus"></i></MkButton>

									<SearchMarker :keywords="['sync', 'watermark', 'preset', 'devices']">
										<MkSwitch :modelValue="watermarkPresetsSyncEnabled" @update:modelValue="changeWatermarkPresetsSyncEnabled">
											<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ i18n.ts.syncBetweenDevices }}</SearchLabel></template>
										</MkSwitch>
									</SearchMarker>
								</div>

								<hr>

								<SearchMarker :keywords="['default', 'watermark', 'preset']">
									<MkPreferenceContainer k="defaultWatermarkPresetId">
										<MkSelect v-model="defaultWatermarkPresetId" :items="[{ label: i18n.ts.none, value: null }, ...prefer.r.watermarkPresets.value.map(p => ({ label: p.name || i18n.ts.noName, value: p.id }))]">
											<template #label><SearchLabel>{{ i18n.ts.defaultPreset }}</SearchLabel></template>
										</MkSelect>
									</MkPreferenceContainer>
								</SearchMarker>
							</div>
						</MkFolder>
					</SearchMarker>

					<SearchMarker :keywords="['label', 'frame', 'credit', 'metadata']">
						<MkFolder>
							<template #icon><i class="ti ti-device-ipad-horizontal"></i></template>
							<template #label><SearchLabel>{{ i18n.ts.frame }}</SearchLabel></template>
							<template #caption>{{ i18n.ts._imageFrameEditor.tip }}</template>

							<div class="_gaps">
								<div class="_gaps_s">
									<XImageFrameItem
										v-for="(preset, i) in prefer.r.imageFramePresets.value"
										:key="preset.id"
										:preset="preset"
										@updatePreset="onUpdateImageFramePreset(preset.id, $event)"
										@del="onDeleteImageFramePreset(preset.id)"
									/>

									<MkButton iconOnly rounded style="margin: 0 auto;" @click="addImageFramePreset"><i class="ti ti-plus"></i></MkButton>

									<SearchMarker :keywords="['sync', 'frame', 'label', 'preset', 'devices']">
										<MkSwitch :modelValue="imageFramePresetsSyncEnabled" @update:modelValue="changeImageFramePresetsSyncEnabled">
											<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ i18n.ts.syncBetweenDevices }}</SearchLabel></template>
										</MkSwitch>
									</SearchMarker>
								</div>
							</div>
						</MkFolder>
					</SearchMarker>

					<SearchMarker :keywords="['default', 'image', 'compression']">
						<MkPreferenceContainer k="defaultImageCompressionLevel">
							<MkSelect
								v-model="defaultImageCompressionLevel" :items="[
									{ label: i18n.ts.none, value: 0 },
									{ label: `${i18n.ts.low} (${i18n.ts._compression._quality.high}; ${i18n.ts._compression._size.large})`, value: 1 },
									{ label: `${i18n.ts.medium} (${i18n.ts._compression._quality.medium}; ${i18n.ts._compression._size.medium})`, value: 2 },
									{ label: `${i18n.ts.high} (${i18n.ts._compression._quality.low}; ${i18n.ts._compression._size.small})`, value: 3 },
								]"
							>
								<template #label><SearchLabel>{{ i18n.ts.defaultCompressionLevel }}</SearchLabel></template>
								<template #caption><div v-html="i18n.ts.defaultCompressionLevel_description"></div></template>
							</MkSelect>
						</MkPreferenceContainer>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['video']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.video }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['default', 'video', 'compression']">
						<MkPreferenceContainer k="defaultVideoCompressionLevel">
							<MkSelect
								v-model="defaultVideoCompressionLevel" :items="[
									{ label: i18n.ts.none, value: 0 },
									{ label: `${i18n.ts.low} (${i18n.ts._compression._quality.high}; ${i18n.ts._compression._size.large})`, value: 1 },
									{ label: `${i18n.ts.medium} (${i18n.ts._compression._quality.medium}; ${i18n.ts._compression._size.medium})`, value: 2 },
									{ label: `${i18n.ts.high} (${i18n.ts._compression._quality.low}; ${i18n.ts._compression._size.small})`, value: 3 },
								]"
							>
								<template #label><SearchLabel>{{ i18n.ts.defaultCompressionLevel }}</SearchLabel></template>
								<template #caption><div v-html="i18n.ts.defaultCompressionLevel_description"></div></template>
							</MkSelect>
						</MkPreferenceContainer>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import tinycolor from 'tinycolor2';
import XWatermarkItem from './drive.WatermarkItem.vue';
import XImageFrameItem from './drive.ImageFrameItem.vue';
import type { WatermarkPreset } from '@/utility/watermark/WatermarkRenderer.js';
import type { ImageFramePreset } from '@/utility/image-frame-renderer/ImageFrameRenderer.js';
import FormLink from '@/components/form/link.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
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
import { selectDriveFolder } from '@/utility/drive.js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import { genId } from '@/utility/id.js';

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

const keepOriginalFilename = prefer.model('keepOriginalFilename');
const defaultWatermarkPresetId = prefer.model('defaultWatermarkPresetId');
const defaultImageCompressionLevel = prefer.model('defaultImageCompressionLevel');
const defaultVideoCompressionLevel = prefer.model('defaultVideoCompressionLevel');

const watermarkPresetsSyncEnabled = ref(prefer.isSyncEnabled('watermarkPresets'));

function changeWatermarkPresetsSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('watermarkPresets').then((res) => {
			if (res == null) return;
			if (res.enabled) watermarkPresetsSyncEnabled.value = true;
		});
	} else {
		prefer.disableSync('watermarkPresets');
		watermarkPresetsSyncEnabled.value = false;
	}
}

const imageFramePresetsSyncEnabled = ref(prefer.isSyncEnabled('imageFramePresets'));

function changeImageFramePresetsSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('imageFramePresets').then((res) => {
			if (res == null) return;
			if (res.enabled) imageFramePresetsSyncEnabled.value = true;
		});
	} else {
		prefer.disableSync('imageFramePresets');
		imageFramePresetsSyncEnabled.value = false;
	}
}

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
	selectDriveFolder(null).then(async ({ canceled, folders }) => {
		if (canceled) return;
		prefer.commit('uploadFolder', folders[0] ? folders[0].id : null);
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

async function addWatermarkPreset() {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkWatermarkEditorDialog.vue').then(x => x.default), {
		presetEditMode: true,
		preset: null,
		layers: [],
	}, {
		presetOk: (preset) => {
			prefer.commit('watermarkPresets', [...prefer.s.watermarkPresets, preset]);
		},
		closed: () => dispose(),
	});
}

function onUpdateWatermarkPreset(id: string, preset: WatermarkPreset) {
	const index = prefer.s.watermarkPresets.findIndex(p => p.id === id);
	if (index !== -1) {
		prefer.commit('watermarkPresets', [
			...prefer.s.watermarkPresets.slice(0, index),
			preset,
			...prefer.s.watermarkPresets.slice(index + 1),
		]);
	}
}

function onDeleteWatermarkPreset(id: string) {
	const index = prefer.s.watermarkPresets.findIndex(p => p.id === id);
	if (index !== -1) {
		prefer.commit('watermarkPresets', [
			...prefer.s.watermarkPresets.slice(0, index),
			...prefer.s.watermarkPresets.slice(index + 1),
		]);

		if (prefer.s.defaultWatermarkPresetId === id) {
			prefer.commit('defaultWatermarkPresetId', null);
		}
	}
}

function onUpdateImageFramePreset(id: string, preset: ImageFramePreset) {
	const index = prefer.s.imageFramePresets.findIndex(p => p.id === id);
	if (index !== -1) {
		prefer.commit('imageFramePresets', [
			...prefer.s.imageFramePresets.slice(0, index),
			preset,
			...prefer.s.imageFramePresets.slice(index + 1),
		]);
	}
}

function onDeleteImageFramePreset(id: string) {
	const index = prefer.s.imageFramePresets.findIndex(p => p.id === id);
	if (index !== -1) {
		prefer.commit('imageFramePresets', [
			...prefer.s.imageFramePresets.slice(0, index),
			...prefer.s.imageFramePresets.slice(index + 1),
		]);
	}
}

async function addImageFramePreset() {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkImageFrameEditorDialog.vue').then(x => x.default), {
		presetEditMode: true,
		preset: null,
		params: null,
	}, {
		presetOk: (preset) => {
			prefer.commit('imageFramePresets', [...prefer.s.imageFramePresets, preset]);
		},
		closed: () => dispose(),
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
