<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<MkSelect
			:items="[
				{ label: 'Simple', value: 'simple' },
				{ label: 'Japanese', value: 'japanese' },
				{ label: 'Museum', value: 'museum' },
				{ label: 'Custom madori', value: 'customMadori' },
			]" :modelValue="controller.roomState.value.env.type" @update:modelValue="v => emit('changeEnvType', v)"
		>
			<template #label>Env type</template>
		</MkSelect>

		<!-- debounce or throttleしないとカラーピッカー上で高速でなぞったときになぜか無限ループになる。ワーカーとの間でラグがあるため、少し前の値がまたmodelValueとしてフィードバックされてしまうためだと思われる -->
		<MkInput :modelValue="getHex(controller.roomState.value.light.color)" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateLightSettings({ ...controller.roomState.value.light, color: c }); }">
			<template #label>light color</template>
		</MkInput>

		<MkRange :modelValue="controller.roomState.value.light.brightness" :min="0" :max="1" :step="0.1" continuousUpdate @update:modelValue="v => controller.updateLightSettings({ ...controller.roomState.value.light, brightness: v })">
			<template #label>light brightness</template>
		</MkRange>

		<template v-if="controller.roomState.value.env.type === 'simple'">
			<XDefaultEnvOptions :options="controller.roomState.value.env.options" @update="v => updateEnvOptions(v)"></XDefaultEnvOptions>
		</template>
		<template v-else-if="controller.roomState.value.env.type === 'customMadori'">
			<XCustomMadoriEnvOptions :options="controller.roomState.value.env.options" @update="v => updateEnvOptions(v)"></XCustomMadoriEnvOptions>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { getHex, getRgb } from 'misskey-world/src/utility.js';
import { throttle } from 'throttle-debounce';
import XDefaultEnvOptions from './room.simple-env-options.vue';
import XCustomMadoriEnvOptions from './room.custom-madori-env-options.vue';
import type { RoomController } from '@/world/room/controller.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import MkFolder from '@/components/MkFolder.vue';

const props = defineProps<{
	controller: RoomController;
}>();

const emit = defineEmits<{
	(ev: 'changeEnvType', value: string): void;
}>();

const updateEnvOptions = throttle(1000, (v: any) => {
	props.controller.updateEnvOptions(v);
});
</script>

<style lang="scss" module>
.root {
}
</style>
