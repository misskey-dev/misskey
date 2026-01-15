<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div v-for="v, k in paramDefs" :key="k">
		<MkSwitch
			v-if="v.type === 'boolean'"
			v-model="params[k]"
		>
			<template #label>{{ v.label ?? k }}</template>
			<template v-if="v.caption != null" #caption>{{ v.caption }}</template>
		</MkSwitch>
		<MkRange
			v-else-if="v.type === 'number'"
			v-model="params[k]"
			continuousUpdate
			:min="v.min"
			:max="v.max"
			:step="v.step"
			:textConverter="v.toViewValue"
			@thumbDoubleClicked="() => {
				params[k] = v.default;
			}"
		>
			<template #label>{{ v.label ?? k }}</template>
			<template v-if="v.caption != null" #caption>{{ v.caption }}</template>
		</MkRange>
		<MkRadios v-else-if="v.type === 'number:enum'" v-model="params[k]" :options="v.enum">
			<template #label>{{ v.label ?? k }}</template>
			<template v-if="v.caption != null" #caption>{{ v.caption }}</template>
		</MkRadios>
		<div v-else-if="v.type === 'seed'">
			<MkRange v-model="params[k]" continuousUpdate type="number" :min="0" :max="10000" :step="1">
				<template #label>{{ v.label ?? k }}</template>
				<template v-if="v.caption != null" #caption>{{ v.caption }}</template>
			</MkRange>
		</div>
		<MkInput v-else-if="v.type === 'color'" :modelValue="getHex(params[k])" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) params[k] = c; }">
			<template #label>{{ v.label ?? k }}</template>
			<template v-if="v.caption != null" #caption>{{ v.caption }}</template>
		</MkInput>
	</div>
	<div v-if="Object.keys(paramDefs).length === 0" :class="$style.nothingToConfigure">
		{{ i18n.ts.nothingToConfigure }}
	</div>
</div>
</template>

<script setup lang="ts">
import type { ImageEffectorRGB, ImageEffectorFxParamDefs } from '@/utility/image-effector/ImageEffector.js';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { i18n } from '@/i18n.js';

defineProps<{
	paramDefs: ImageEffectorFxParamDefs;
}>();

const params = defineModel<Record<string, any>>({ required: true });

function getHex(c: ImageEffectorRGB) {
	return `#${c.map(x => (x * 255).toString(16).padStart(2, '0')).join('')}`;
}

function getRgb(hex: string | number): ImageEffectorRGB | null {
	if (
		typeof hex === 'number' ||
		typeof hex !== 'string' ||
		!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
	) {
		return null;
	}

	const m = hex.slice(1).match(/[0-9a-fA-F]{2}/g);
	if (m == null) return [0, 0, 0];
	return m.map(x => parseInt(x, 16) / 255) as ImageEffectorRGB;
}
</script>

<style module>
.nothingToConfigure {
	opacity: 0.7;
	text-align: center;
	font-size: 14px;
	padding: 0 10px;
}
</style>
