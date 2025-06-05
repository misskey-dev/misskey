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
			<MkSwitch v-if="v.type === 'boolean'" v-model="layer.params[k]">
				<template #label>{{ k }}</template>
			</MkSwitch>
			<MkRange v-else-if="v.type === 'number'" v-model="layer.params[k]" continuousUpdate :min="v.min" :max="v.max" :step="v.step">
				<template #label>{{ k }}</template>
			</MkRange>
			<MkRadios v-else-if="v.type === 'number:enum'" v-model="layer.params[k]">
				<template #label>{{ k }}</template>
				<option v-for="item in v.enum" :value="item.value">{{ item.label }}</option>
			</MkRadios>
			<div v-else-if="v.type === 'seed'">
				<MkRange v-model="layer.params[k]" continuousUpdate type="number" :min="0" :max="10000" :step="1">
					<template #label>{{ k }}</template>
				</MkRange>
			</div>
			<MkInput v-else-if="v.type === 'color'" :modelValue="`#${(layer.params[k][0] * 255).toString(16).padStart(2, '0')}${(layer.params[k][1] * 255).toString(16).padStart(2, '0')}${(layer.params[k][2] * 255).toString(16).padStart(2, '0')}`" type="color" @update:modelValue="v => { const c = v.slice(1).match(/.{2}/g)?.map(x => parseInt(x, 16) / 255); if (c) layer.params[k] = c; }">
				<template #label>{{ k }}</template>
			</MkInput>
		</div>
	</div>
</MkFolder>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted } from 'vue';
import type { ImageEffectorLayer } from '@/utility/image-effector/ImageEffector.js';
import { i18n } from '@/i18n.js';
import { ImageEffector } from '@/utility/image-effector/ImageEffector.js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import FormSlot from '@/components/form/slot.vue';
import MkPositionSelector from '@/components/MkPositionSelector.vue';
import * as os from '@/os.js';
import { selectFile } from '@/utility/drive.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { prefer } from '@/preferences.js';
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
</script>

<style module>
.root {

}
</style>
