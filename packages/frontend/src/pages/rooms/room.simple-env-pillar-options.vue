<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<MkSelect
			:items="[
				{ label: 'None', value: null },
				{ label: 'Wood', value: 'wood' },
				{ label: 'Concrete', value: 'concrete' },
			]" :modelValue="options.material" @update:modelValue="v => { update({ material: v }); }"
		>
			<template #label>wallpaper</template>
		</MkSelect>
		<!-- debounce or throttleしないとカラーピッカー上で高速でなぞったときになぜか無限ループになる。ワーカーとの間でラグがあるため、少し前の値がまたmodelValueとしてフィードバックされてしまうためだと思われる -->
		<MkInput :modelValue="getHex(options.color)" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) update({ color: c }); }">
			<template #label>color</template>
		</MkInput>
		<MkSwitch :modelValue="options.show" @update:modelValue="v => { update({ show: v }); }">
			<template #label>show</template>
		</MkSwitch>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { getHex, getRgb } from 'misskey-world/src/utility.js';
import type { SimpleEnvOptions } from 'misskey-world/src/room/env.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';

const props = defineProps<{
	options: SimpleEnvOptions['pillars']['nw' | 'ne' | 'sw' | 'se'];
}>();

const emit = defineEmits<{
	(ev: 'update', v: SimpleEnvOptions['pillars']['nw' | 'ne' | 'sw' | 'se']): void;
}>();

function update(v: Partial<SimpleEnvOptions['pillars']['nw' | 'ne' | 'sw' | 'se']>) {
	emit('update', { ...props.options, ...v });
}
</script>

<style lang="scss" module>
.root {
}
</style>
