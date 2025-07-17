<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :defaultOpen="true" :canPage="false">
	<template #label>{{ fx.name }}</template>
	<template #footer>
		<div class="_buttons">
			<MkButton iconOnly @click="emit('del')"><i class="ti ti-trash"></i></MkButton>
			<MkButton iconOnly @click="emit('swapUp')"><i class="ti ti-arrow-up"></i></MkButton>
			<MkButton iconOnly @click="emit('swapDown')"><i class="ti ti-arrow-down"></i></MkButton>
		</div>
	</template>

	<div :class="$style.root" class="_gaps">
		<div v-for="[k, v] in Object.entries(fx.params)" :key="k">
			<MkSwitch
				v-if="v.type === 'boolean'"
				v-model="layer.params[k]"
			>
				<template #label>{{ fx.params[k].label ?? k }}</template>
			</MkSwitch>
			<MkRange
				v-else-if="v.type === 'number'"
				v-model="layer.params[k]"
				continuousUpdate
				:min="v.min"
				:max="v.max"
				:step="v.step"
				:textConverter="fx.params[k].toViewValue"
				@thumbDoubleClicked="() => {
					if (fx.params[k].default != null) {
						layer.params[k] = fx.params[k].default;
					} else {
						layer.params[k] = v.min;
					}
				}"
			>
				<template #label>{{ fx.params[k].label ?? k }}</template>
			</MkRange>
			<MkRadios
				v-else-if="v.type === 'number:enum'"
				v-model="layer.params[k]"
			>
				<template #label>{{ fx.params[k].label ?? k }}</template>
				<option v-for="item in v.enum" :value="item.value">{{ item.label }}</option>
			</MkRadios>
			<div v-else-if="v.type === 'seed'">
				<MkRange
					v-model="layer.params[k]"
					continuousUpdate
					type="number"
					:min="0"
					:max="10000"
					:step="1"
				>
					<template #label>{{ fx.params[k].label ?? k }}</template>
				</MkRange>
			</div>
			<MkInput
				v-else-if="v.type === 'color'"
				:modelValue="getHex(layer.params[k])"
				type="color"
				@update:modelValue="v => { const c = getRgb(v); if (c != null) layer.params[k] = c; }"
			>
				<template #label>{{ fx.params[k].label ?? k }}</template>
			</MkInput>
		</div>
	</div>
</MkFolder>
</template>

<script setup lang="ts">
import type { ImageEffectorLayer } from '@/utility/image-effector/ImageEffector.js';
import { i18n } from '@/i18n.js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { FXS } from '@/utility/image-effector/fxs.js';

const layer = defineModel<ImageEffectorLayer>('layer', { required: true });
const fx = FXS.find((fx) => fx.id === layer.value.fxId);
if (fx == null) {
	throw new Error(`Unrecognized effect: ${layer.value.fxId}`);
}

const emit = defineEmits<{
	(e: 'del'): void;
	(e: 'swapUp'): void;
	(e: 'swapDown'): void;
}>();

function getHex(c: [number, number, number]) {
	return `#${c.map(x => (x * 255).toString(16).padStart(2, '0')).join('')}`;
}

function getRgb(hex: string | number): [number, number, number] | null {
	if (
		typeof hex === 'number' ||
		typeof hex !== 'string' ||
		!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
	) {
		return null;
	}

	const m = hex.slice(1).match(/[0-9a-fA-F]{2}/g);
	if (m == null) return [0, 0, 0];
	return m.map(x => parseInt(x, 16) / 255) as [number, number, number];
}
</script>

<style module>
.root {

}
</style>
