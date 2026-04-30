<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<div v-for="[k, s] in Object.entries(schema)" :key="k">
			<div>{{ s.label }}</div>
			<div v-if="s.type === 'color'">
				<MkInput :modelValue="getHex(options[k])" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) emit('update', k, c); }"></MkInput>
			</div>
			<div v-else-if="s.type === 'boolean'">
				<MkSwitch :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkSwitch>
			</div>
			<div v-else-if="s.type === 'enum'">
				<MkSelect :items="s.enum.map(e => ({ label: e, value: e }))" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkSelect>
			</div>
			<div v-else-if="s.type === 'string'">
				<MkInput type="text" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkInput>
			</div>
			<div v-else-if="s.type === 'range'">
				<MkRange :continuousUpdate="true" :min="s.min" :max="s.max" :step="s.step" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkRange>
			</div>
			<div v-else-if="s.type === 'image'">
				<MkInput type="text" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkInput>
			</div>
			<div v-else-if="s.type === 'seed'">
				<MkRange :continuousUpdate="true" :min="0" :max="1000" :step="1" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkRange>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import type { ObjectDef } from '@/world/room/object.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { getHex, getRgb } from '@/world/utility.js';

const props = defineProps<{
	schema: ObjectDef['options']['schema'];
	options: any;
}>();

const emit = defineEmits<{
	(ev: 'update', k: string, v: any): void;
}>();
</script>

<style lang="scss" module>
.root {
}
</style>
