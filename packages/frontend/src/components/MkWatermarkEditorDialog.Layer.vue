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
				v-model:x="layer.alignX"
				v-model:y="layer.alignY"
			></MkPositionSelector>
		</FormSlot>

		<MkRange
			v-model="layer.scale"
			:min="0"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
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
				v-model:x="layer.alignX"
				v-model:y="layer.alignY"
			></MkPositionSelector>
		</FormSlot>

		<MkRange
			v-model="layer.scale"
			:min="0"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.opacity }}</template>
		</MkRange>

		<MkSwitch v-model="layer.repeat">
			<template #label>{{ i18n.ts._watermarkEditor.repeat }}</template>
		</MkSwitch>
	</template>
</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted } from 'vue';
import { v4 as uuid } from 'uuid';
import type { WatermarkerLayer, WatermarkPreset } from '@/utility/watermarker.js';
import { i18n } from '@/i18n.js';
import { Watermarker } from '@/utility/watermarker.js';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import FormSlot from '@/components/form/slot.vue';
import MkPositionSelector from '@/components/MkPositionSelector.vue';
import * as os from '@/os.js';
import { selectFile } from '@/utility/drive.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { prefer } from '@/preferences.js';

const layer = defineModel<WatermarkerLayer>('layer', { required: true });

const driveFile = ref();
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
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.selectFile).then((file) => {
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
