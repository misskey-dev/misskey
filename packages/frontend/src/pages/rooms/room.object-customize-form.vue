<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps_s">
		<MkFolder v-for="[k, s] in Object.entries(schema.options.schema)" :key="k">
			<template #label>{{ OBJECT_UI_DEFS[schema.id].options[k].label }}</template>
			<template #suffix>
				<span v-if="s.type === 'color'" :style="{ color: getHex(options[k]) }">●</span>
				<span v-else-if="s.type === 'material'" :style="{ color: getHex(options[k].color) }">●</span>
			</template>

			<div v-if="s.type === 'color'">
				<!-- debounce or throttleしないとカラーピッカー上で高速でなぞったときになぜか無限ループになる。ワーカーとの間でラグがあるため、少し前の値がまたmodelValueとしてフィードバックされてしまうためだと思われる -->
				<MkInput :modelValue="getHex(options[k])" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) emit('update', k, c); }"></MkInput>
			</div>
			<div v-else-if="s.type === 'material'" class="_gaps_s">
				<!-- debounce or throttleしないとカラーピッカー上で高速でなぞったときになぜか無限ループになる。ワーカーとの間でラグがあるため、少し前の値がまたmodelValueとしてフィードバックされてしまうためだと思われる -->
				<MkInput :modelValue="getHex(options[k].color)" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) updateMaterialColor(k, c); }">
					<template #label>{{ i18n.ts.color }}</template>
				</MkInput>
				<template v-if="advancedCustomize">
					<MkRange :continuousUpdate="true" :min="0" :max="1" :step="0.1" :modelValue="options[k].metallic" @update:modelValue="v => updateMaterialMetallic(k, v)">
						<template #label>{{ i18n.ts._miRoom.material_metallic }}</template>
					</MkRange>
					<MkRange :continuousUpdate="true" :min="0" :max="1" :step="0.1" :modelValue="options[k].roughness" @update:modelValue="v => updateMaterialRoughness(k, v)">
						<template #label>{{ i18n.ts._miRoom.material_roughness }}</template>
					</MkRange>
				</template>
			</div>
			<div v-else-if="s.type === 'light'" class="_gaps_s">
				<!-- debounce or throttleしないとカラーピッカー上で高速でなぞったときになぜか無限ループになる。ワーカーとの間でラグがあるため、少し前の値がまたmodelValueとしてフィードバックされてしまうためだと思われる -->
				<MkInput :modelValue="getHex(options[k].color)" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) updateLightColor(k, c); }">
					<template #label>{{ i18n.ts.color }}</template>
				</MkInput>
				<MkRange :continuousUpdate="true" :min="0" :max="1" :step="0.1" :modelValue="options[k].brightness" @update:modelValue="v => updateLightBrightness(k, v)">
					<template #label>{{ i18n.ts._miRoom.light_brightness }}</template>
				</MkRange>
			</div>
			<div v-else-if="s.type === 'boolean'">
				<MkSwitch :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkSwitch>
			</div>
			<div v-else-if="s.type === 'enum'">
				<MkSelect :items="s.enum.map(e => ({ label: OBJECT_UI_DEFS[schema.id].options[k].enum[e.value].label, value: e.value }))" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkSelect>
			</div>
			<div v-else-if="s.type === 'string'">
				<MkInput type="text" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkInput>
			</div>
			<div v-else-if="s.type === 'range'">
				<MkRange :continuousUpdate="true" :min="s.min" :max="s.max" :step="s.step" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkRange>
			</div>
			<div v-else-if="s.type === 'image'" class="_gaps_s">
				<MkSelect :items="[{ label: i18n.ts.none, value: null }, { label: i18n.ts.custom, value: '_custom_' }, ...(s.presets.length > 0 ? [{ type: 'divider' } as const] : []), ...s.presets.map(e => ({ label: OBJECT_UI_DEFS[schema.id].options[k].presets[e.value].label, value: e.value }))]" :modelValue="options[k].type" @update:modelValue="v => changeImageType(k, v)"></MkSelect>

				<div v-if="options[k].type === '_custom_'" class="_buttons">
					<MkButton primary inline @click="changeImage(k)"><i class="ti ti-cloud"></i> {{ i18n.ts.choose }}...</MkButton>
					<MkButton v-if="options[k].driveFileId != null" danger inline iconOnly @click="clearImage(k)"><i class="ti ti-x"></i></MkButton>
				</div>

				<hr>

				<MkRadios :options="[{ label: i18n.ts._miRoom.imageFit_cover, value: 'cover' }, { label: i18n.ts._miRoom.imageFit_contain, value: 'contain' }, { label: i18n.ts._miRoom.imageFit_stretch, value: 'stretch' }]" :modelValue="options[k].fit ?? 'cover'" @update:modelValue="v => changeImageFit(k, v)">
					<template #label>{{ i18n.ts._miRoom.imageFit }}</template>
				</MkRadios>
			</div>
			<div v-else-if="s.type === 'seed'">
				<MkRange :continuousUpdate="true" :min="0" :max="1000" :step="1" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkRange>
			</div>
		</MkFolder>

		<MkSwitch v-model="advancedCustomize">{{ i18n.ts._miRoom.advancedCustomize }}</MkSwitch>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import { getHex, getRgb } from 'misskey-world/src/utility.js';
import type { ObjectSchemaDef, RawOptions } from 'misskey-world/src/room/object.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { chooseDriveFile } from '@/utility/drive.js';
import MkRadios from '@/components/MkRadios.vue';
import MkFolder from '@/components/MkFolder.vue';
import { OBJECT_UI_DEFS } from '@/world/room/object-ui-defs.js';
import { prefer } from '@/preferences.js';

const props = defineProps<{
	schema: ObjectSchemaDef<any>;
	options: RawOptions;
	addFileAttachment: ((file: Misskey.entities.DriveFile) => void);
}>();

const emit = defineEmits<{
	(ev: 'update', k: string, v: any): void;
}>();

const advancedCustomize = prefer.model('world.room.advancedCustomize');

function changeImageType(k: string, type: string) {
	emit('update', k, { ...props.options[k], type, driveFileId: type === '_custom_' ? props.options[k].driveFileId : null });
}

async function changeImage(k: string) {
	chooseDriveFile({ multiple: false }).then((fileResponse) => {
		if (fileResponse.length === 0) return;
		const file = fileResponse[0];
		if (!file.type.startsWith('image/')) {
			os.alert({
				type: 'error',
				text: 'The selected file is not an image.',
			});
			return;
		}
		if (file.size > 1024 * 1024 * 5) {
			os.alert({
				type: 'error',
				text: 'The file size exceeds the limit of 5MB.',
			});
			return;
		}
		if (Math.max(file.properties.width ?? 0, file.properties.height ?? 0) > 2048) {
			os.alert({
				type: 'error',
				text: 'The image dimensions exceed the limit of 2048x2048 pixels.',
			});
			return;
		}
		props.addFileAttachment(file);
		emit('update', k, {
			...props.options[k],
			driveFileId: file.id,
		});
	});
}

function clearImage(k: string) {
	emit('update', k, { ...props.options[k], driveFileId: null });
}

function changeImageFit(k: string, fit: string) {
	emit('update', k, { ...props.options[k], fit });
}

function updateMaterialColor(k: string, color: { r: number; g: number; b: number }) {
	emit('update', k, { ...props.options[k], color });
}

function updateMaterialMetallic(k: string, metallic: number) {
	emit('update', k, { ...props.options[k], metallic });
}

function updateMaterialRoughness(k: string, roughness: number) {
	emit('update', k, { ...props.options[k], roughness });
}

function updateLightColor(k: string, color: { r: number; g: number; b: number }) {
	emit('update', k, { ...props.options[k], color });
}

function updateLightBrightness(k: string, brightness: number) {
	emit('update', k, { ...props.options[k], brightness });
}
</script>

<style lang="scss" module>
.root {
}
</style>
