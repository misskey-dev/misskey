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
			:modelValue="layer.align.margin ?? 0"
			:min="0"
			:max="0.25"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
			@update:modelValue="(v) => (layer as Extract<WatermarkPreset['layers'][number], { type: 'text' }>).align.margin = v"
		>
			<template #label>{{ i18n.ts._watermarkEditor.margin }}</template>
		</MkRange>

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

		<MkSwitch v-model="layerPreserveBoundingRect">
			<template #label>{{ i18n.ts._watermarkEditor.preserveBoundingRect }}</template>
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
			:modelValue="layer.align.margin ?? 0"
			:min="0"
			:max="0.25"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
			@update:modelValue="(v) => (layer as Extract<WatermarkPreset['layers'][number], { type: 'image' }>).align.margin = v"
		>
			<template #label>{{ i18n.ts._watermarkEditor.margin }}</template>
		</MkRange>

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

		<MkSwitch v-model="layerPreserveBoundingRect">
			<template #label>{{ i18n.ts._watermarkEditor.preserveBoundingRect }}</template>
		</MkSwitch>
	</template>

	<template v-else-if="layer.type === 'qr'">
		<MkInput v-model="layer.data" debounce>
			<template #label>{{ i18n.ts._watermarkEditor.text }}</template>
			<template #caption>{{ i18n.ts._watermarkEditor.leaveBlankToAccountUrl }}</template>
		</MkInput>

		<FormSlot>
			<template #label>{{ i18n.ts._watermarkEditor.position }}</template>
			<MkPositionSelector
				v-model:x="layer.align.x"
				v-model:y="layer.align.y"
			></MkPositionSelector>
		</FormSlot>

		<MkRange
			:modelValue="layer.align.margin ?? 0"
			:min="0"
			:max="0.25"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
			@update:modelValue="(v) => (layer as Extract<WatermarkPreset['layers'][number], { type: 'qr' }>).align.margin = v"
		>
			<template #label>{{ i18n.ts._watermarkEditor.margin }}</template>
		</MkRange>

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
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.opacity }}</template>
		</MkRange>
	</template>

	<template v-else-if="layer.type === 'stripe'">
		<MkRange
			v-model="layer.frequency"
			:min="1"
			:max="30"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.stripeFrequency }}</template>
		</MkRange>

		<MkRange
			v-model="layer.threshold"
			:min="0"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.stripeWidth }}</template>
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
	</template>

	<template v-else-if="layer.type === 'polkadot'">
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
			v-model="layer.scale"
			:min="0"
			:max="10"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.majorRadius"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.polkadotMainDotRadius }}</template>
		</MkRange>

		<MkRange
			v-model="layer.majorOpacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.polkadotMainDotOpacity }}</template>
		</MkRange>

		<MkRange
			v-model="layer.minorDivisions"
			:min="0"
			:max="16"
			:step="1"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.polkadotSubDotDivisions }}</template>
		</MkRange>

		<MkRange
			v-model="layer.minorRadius"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.polkadotSubDotRadius }}</template>
		</MkRange>

		<MkRange
			v-model="layer.minorOpacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.polkadotSubDotOpacity }}</template>
		</MkRange>
	</template>

	<template v-else-if="layer.type === 'checker'">
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
			v-model="layer.scale"
			:min="0"
			:max="10"
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
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ i18n.ts._watermarkEditor.opacity }}</template>
		</MkRange>
	</template>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import * as Misskey from 'misskey-js';
import type { WatermarkPreset } from '@/utility/watermark/WatermarkRenderer.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import FormSlot from '@/components/form/slot.vue';
import MkPositionSelector from '@/components/MkPositionSelector.vue';
import * as os from '@/os.js';
import { selectFile } from '@/utility/drive.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const layer = defineModel<WatermarkPreset['layers'][number]>('layer', { required: true });

const layerPreserveBoundingRect = computed({
	get: () => {
		if (layer.value.type === 'text' || layer.value.type === 'image') {
			return !layer.value.noBoundingBoxExpansion;
		}
		return false;
	},
	set: (v: boolean) => {
		if (layer.value.type === 'text' || layer.value.type === 'image') {
			layer.value.noBoundingBoxExpansion = !v;
		}
	},
});

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

function chooseFile(ev: PointerEvent) {
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
