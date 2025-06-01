<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :defaultOpen="true" :canPage="false">
	<template #label>{{ fx.name }}</template>
	<template #footer>
		<MkButton @click="emit('del')">{{ i18n.ts.remove }}</MkButton>
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
		</div>
	</div>
</MkFolder>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted } from 'vue';
import { v4 as uuid } from 'uuid';
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
}>();
</script>

<style module>
.root {

}
</style>
