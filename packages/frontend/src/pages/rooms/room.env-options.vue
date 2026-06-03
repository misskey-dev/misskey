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
		<MkInput :modelValue="getHex(controller.roomState.value.roomLightColor)" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateRoomLightColor(c); }">
			<template #label>light color</template>
		</MkInput>

		<template v-if="controller.roomState.value.env.type === 'simple'">
			<XDefaultEnvOptions :options="controller.roomState.value.env.options" @update="v => controller.updateEnvOptions(v)"></XDefaultEnvOptions>
		</template>
		<template v-else-if="controller.roomState.value.env.type === 'customMadori'">
			<XCustomMadoriEnvOptions :options="controller.roomState.value.env.options" @update="v => controller.updateEnvOptions(v)"></XCustomMadoriEnvOptions>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { getHex, getRgb } from 'misskey-world/src/utility.js';
import XWallOption from './room.simple-env-wall-options.vue';
import XPillarOption from './room.simple-env-pillar-options.vue';
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

</script>

<style lang="scss" module>
.root {
}
</style>
