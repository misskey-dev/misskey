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
		<MkInput :modelValue="getHex(options.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) update({ color: c }); }">
			<template #label>color</template>
		</MkInput>
		<hr>
		<MkSwitch :modelValue="options.withHari" @update:modelValue="v => { update({ withHari: v }); }">
			<template #label>with Hari</template>
		</MkSwitch>
		<MkSelect
			:items="[
				{ label: 'None', value: null },
				{ label: 'Wood', value: 'wood' },
				{ label: 'Concrete', value: 'concrete' },
			]" :modelValue="options.hariMaterial" @update:modelValue="v => { update({ hariMaterial: v }); }"
		>
			<template #label>hari material</template>
		</MkSelect>
		<MkInput :modelValue="getHex(options.hariColor)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) update({ hariColor: c }); }">
			<template #label>hari color</template>
		</MkInput>
		<hr>
		<MkSwitch :modelValue="options.withHabaki" @update:modelValue="v => { update({ withHabaki: v }); }">
			<template #label>with Habaki</template>
		</MkSwitch>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import type { ObjectDef } from '@/world/room/object.js';
import type { SimpleHeyaOptions } from '@/world/room/heya.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { getHex, getRgb } from '@/world/utility.js';

const props = defineProps<{
	options: SimpleHeyaOptions['walls']['n' | 's' | 'w' | 'e'];
}>();

const emit = defineEmits<{
	(ev: 'update', v: SimpleHeyaOptions['walls']['n' | 's' | 'w' | 'e']): void;
}>();

function update(v: Partial<SimpleHeyaOptions['walls']['n' | 's' | 'w' | 'e']>) {
	emit('update', { ...props.options, ...v });
}
</script>

<style lang="scss" module>
.root {
}
</style>
