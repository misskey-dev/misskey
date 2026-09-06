<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<MkSelect
			:items="[
				{ label: 'Normal', value: null },
				{ label: 'Window', value: 'window' },
			]" :modelValue="type" @update:modelValue="v => { update({ type: v }); }"
		>
			<template #label>Type</template>
		</MkSelect>
		<hr>
		<MkSwitch :modelValue="withBeam" @update:modelValue="v => { update({ withBeam: v }); }">
			<template #label>with Beam</template>
		</MkSwitch>
		<hr>
		<MkSwitch :modelValue="withBaseboard" @update:modelValue="v => { update({ withBaseboard: v }); }">
			<template #label>with Baseboard</template>
		</MkSwitch>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { getHex, getRgb } from 'misskey-world/src/utility.js';
import type { CustomMadoriEnvOptions, CustomMadoriEnvWall } from 'misskey-world/src/room/env.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';

const props = defineProps<{
	options: CustomMadoriEnvWall | null | undefined;
}>();

const emit = defineEmits<{
	(ev: 'update', v: CustomMadoriEnvWall): void;
}>();

const type = computed(() => props.options?.type ?? null);
const withBeam = computed(() => props.options?.withBeam ?? false);
const withBaseboard = computed(() => props.options?.withBaseboard ?? false);

function update(v: Partial<CustomMadoriEnvWall>) {
	emit('update', { ...props.options, ...v });
}
</script>

<style lang="scss" module>
.root {
}
</style>
