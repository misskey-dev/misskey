<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_gaps">
	<div v-for="[k, v] in Object.entries(fx.params)" :key="k">
		<MkSwitch v-if="v.type === 'boolean'" v-model="layer.params[k]">
			<template #label>{{ k }}</template>
		</MkSwitch>
		<MkRange v-else-if="v.type === 'number'" v-model="layer.params[k]" continuousUpdate :min="v.min" :max="v.max" :step="v.step">
			<template #label>{{ k }}</template>
		</MkRange>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted } from 'vue';
import { v4 as uuid } from 'uuid';
import type { ImageEffectorLayer } from '@/utility/image-effector/ImageEffector.js';
import { i18n } from '@/i18n.js';
import { FXS, ImageEffector } from '@/utility/image-effector/ImageEffector.js';
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

const layer = defineModel<ImageEffectorLayer>('layer', { required: true });
const fx = FXS.find((fx) => fx.id === layer.value.fxId);
if (fx == null) {
	throw new Error(`Unrecognized effect: ${layer.value.fxId}`);
}

</script>

<style module>
.root {

}
</style>
