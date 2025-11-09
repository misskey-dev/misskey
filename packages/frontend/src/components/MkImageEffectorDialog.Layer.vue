<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :defaultOpen="true" :canPage="false">
	<template #label>{{ fx.uiDefinition.name }}</template>
	<template #footer>
		<div class="_buttons">
			<MkButton iconOnly @click="emit('del')"><i class="ti ti-trash"></i></MkButton>
			<MkButton iconOnly @click="emit('swapUp')"><i class="ti ti-arrow-up"></i></MkButton>
			<MkButton iconOnly @click="emit('swapDown')"><i class="ti ti-arrow-down"></i></MkButton>
		</div>
	</template>

	<MkImageEffectorFxForm v-model="layer.params" :paramDefs="fx.uiDefinition.params"/>
</MkFolder>
</template>

<script setup lang="ts">
import type { ImageEffectorLayer } from '@/utility/image-effector/ImageEffector.js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import MkImageEffectorFxForm from '@/components/MkImageEffectorFxForm.vue';
import { FXS } from '@/utility/image-effector/fxs.js';

const layer = defineModel<ImageEffectorLayer>('layer', { required: true });
const fx = FXS[layer.value.fxId];
if (fx == null) {
	throw new Error(`Unrecognized effect: ${layer.value.fxId}`);
}

const emit = defineEmits<{
	(ev: 'del'): void;
	(ev: 'swapUp'): void;
	(ev: 'swapDown'): void;
}>();
</script>
