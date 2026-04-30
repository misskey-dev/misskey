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
			]" :modelValue="controller.roomState.value.heya.type" @update:modelValue="v => controller.changeHeyaType(v)"
		>
			<template #label>Heya type</template>
		</MkSelect>

		<!-- debounceしないとカラーピッカー上で高速でなぞったときになぜか無限ループになる。ワーカーとの間でラグがあるため、少し前の値がまたmodelValueとしてフィードバックされてしまうためだと思われる -->
		<MkInput :modelValue="getHex(controller.roomState.value.roomLightColor)" type="color" debounce @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateRoomLightColor(c); }">
			<template #label>light color</template>
		</MkInput>

		<template v-if="controller.roomState.value.heya.type === 'simple'">
			<XDefaultHeyaOptions :options="controller.roomState.value.heya.options" @update="v => controller.updateHeyaOptions(v)"></XDefaultHeyaOptions>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import XWallOption from './room.default-heya-wall-options.vue';
import XPillarOption from './room.default-heya-pillar-options.vue';
import XDefaultHeyaOptions from './room.default-heya-options.vue';
import type { ObjectDef } from '@/world/room/object.js';
import type { SimpleHeyaOptions } from '@/world/room/heya.js';
import type { RoomState } from '@/world/room/engine.js';
import type { RoomController } from '@/world/room/controller.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { getHex, getRgb } from '@/world/utility.js';
import MkFolder from '@/components/MkFolder.vue';

const props = defineProps<{
	controller: RoomController;
}>();

</script>

<style lang="scss" module>
.root {
}
</style>
