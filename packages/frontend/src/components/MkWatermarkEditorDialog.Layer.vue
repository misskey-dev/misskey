<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_gaps">
	<template v-if="layer.type === 'text'">
		<MkInput v-model="layer.text">
			<template #label>{{ i18n.ts._watermarkEditor.text }}</template>
		</MkInput>

		<FormSlot>
			<template #label>{{ i18n.ts._watermarkEditor.position }}</template>
			<MkPositionSelector
				v-model:x="layer.align.x"
				v-model:y="layer.align.y"
			></MkPositionSelector>
		</FormSlot>

		<MkRange
			v-model="layer.scale"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.angle"
			:min="-1"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.angle }}</template>
		</MkRange>

		<MkRange
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.opacity }}</template>
		</MkRange>

		<MkSwitch v-model="layer.repeat">
			<template #label>{{ i18n.ts._watermarkEditor.repeat }}</template>
		</MkSwitch>
	</template>

	<template v-else-if="layer.type === 'image'">
		<MkButton inline rounded primary @click="chooseFile">{{ i18n.ts.selectFile }}</MkButton>

		<FormSlot>
			<template #label>{{ i18n.ts._watermarkEditor.position }}</template>
			<MkPositionSelector
				v-model:x="layer.align.x"
				v-model:y="layer.align.y"
			></MkPositionSelector>
		</FormSlot>

		<MkRange
			v-model="layer.scale"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.angle"
			:min="-1"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.angle }}</template>
		</MkRange>

		<MkRange
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.opacity }}</template>
		</MkRange>

		<MkSwitch v-model="layer.repeat">
			<template #label>{{ i18n.ts._watermarkEditor.repeat }}</template>
		</MkSwitch>

		<MkSwitch v-model="layer.cover">
			<template #label>{{ i18n.ts._watermarkEditor.cover }}</template>
		</MkSwitch>
	</template>

	<MkImageEffectorFxForm
		v-else-if="fx != null"
		v-model="layer"
		:paramDefs="fx.params"
	/>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import { WATERMARK_FXS } from '@/utility/watermark.js';
import type { WatermarkPreset } from '@/utility/watermark.js';
import type { ImageEffectorFx } from '@/utility/image-effector/ImageEffector.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import FormSlot from '@/components/form/slot.vue';
import MkPositionSelector from '@/components/MkPositionSelector.vue';
import MkImageEffectorFxForm from '@/components/MkImageEffectorFxForm.vue';
import * as os from '@/os.js';
import { selectFile } from '@/utility/drive.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const layer = defineModel<WatermarkPreset['layers'][number]>('layer', { required: true });
const fx = computed(() => WATERMARK_FXS.find((fx) => fx.id !== 'watermarkPlacement' && fx.id === layer.value.type) as Exclude<typeof WATERMARK_FXS[number], ImageEffectorFx<"watermarkPlacement", any, any>> ?? null);

const driveFile = ref<Misskey.entities.DriveFile | null>(null);
const driveFileError = ref(false);
onMounted(async () => {
	if (layer.value.type === 'image' && layer.value.imageId != null) {
		await misskeyApi('drive/files/show', {
			fileId: layer.value.imageId,
		}).then((res) => {
			driveFile.value = res;
		}).catch((err) => {
			driveFileError.value = true;
		});
	}
});

function chooseFile(ev: MouseEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
		label: i18n.ts.selectFile,
		features: {
			watermark: false,
		},
	}).then((file) => {
		if (layer.value.type !== 'image') return;
		if (!file.type.startsWith('image')) {
			os.alert({
				type: 'warning',
				title: i18n.ts._watermarkEditor.driveFileTypeWarn,
				text: i18n.ts._watermarkEditor.driveFileTypeWarnDescription,
			});
			return;
		}

		layer.value.imageId = file.id;
		layer.value.imageUrl = file.url;
		driveFileError.value = false;
	});
}
</script>

<style module>
.root {

}
</style>
