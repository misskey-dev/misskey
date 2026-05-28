<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps_s">
		<MkFolder v-for="[k, s] in Object.entries(schema.options.schema)" :key="k">
			<template #label>{{ AVATAR_ACCESSORY_UI_DEFS[schema.id].options[k].label }}</template>
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
					<MkRange :continuousUpdate="true" :min="0" :max="1" :step="0.05" :modelValue="options[k].roughness" @update:modelValue="v => updateMaterialRoughness(k, v)">
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
				<MkSelect :items="s.enum.map(e => ({ label: AVATAR_ACCESSORY_UI_DEFS[schema.id].options[k].enum[e.value].label, value: e.value }))" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkSelect>
			</div>
			<div v-else-if="s.type === 'string'">
				<MkInput type="text" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkInput>
			</div>
			<div v-else-if="s.type === 'range'">
				<MkRange :continuousUpdate="true" :min="s.min" :max="s.max" :step="s.step" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkRange>
			</div>
		</MkFolder>

		<MkSwitch v-model="advancedCustomize">{{ i18n.ts._miWorld.advancedCustomize }}</MkSwitch>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { getHex, getRgb } from 'misskey-world/src/utility.js';
import type { AccessorySchemaDef } from 'misskey-world/src/avatars/accessory.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkFolder from '@/components/MkFolder.vue';
import { prefer } from '@/preferences.js';
import { AVATAR_ACCESSORY_UI_DEFS } from '@/world/avatars/accessory-ui-defs.js';

const props = defineProps<{
	schema: AccessorySchemaDef<any>;
	options: Record<string, unknown>;
}>();

const emit = defineEmits<{
	(ev: 'update', k: string, v: any): void;
}>();

const advancedCustomize = ref(false);

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
