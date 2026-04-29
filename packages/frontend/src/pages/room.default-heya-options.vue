<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<MkFolder>
			<template #label>Wall N</template>
			<XWallOption :options="options.walls.n" @update="v => { emit('update', { ...options, walls: { ...options.walls, n: v } }); }"></XWallOption>
		</MkFolder>
		<MkFolder>
			<template #label>Wall S</template>
			<XWallOption :options="options.walls.s" @update="v => { emit('update', { ...options, walls: { ...options.walls, s: v } }); }"></XWallOption>
		</MkFolder>
		<MkFolder>
			<template #label>Wall W</template>
			<XWallOption :options="options.walls.w" @update="v => { emit('update', { ...options, walls: { ...options.walls, w: v } }); }"></XWallOption>
		</MkFolder>
		<MkFolder>
			<template #label>Wall E</template>
			<XWallOption :options="options.walls.e" @update="v => { emit('update', { ...options, walls: { ...options.walls, e: v } }); }"></XWallOption>
		</MkFolder>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import XWallOption from './room.default-heya-wall-options.vue';
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
import MkFolder from '@/components/MkFolder.vue';

const props = defineProps<{
	options: SimpleHeyaOptions;
}>();

const emit = defineEmits<{
	(ev: 'update', v: SimpleHeyaOptions): void;
}>();
</script>

<style lang="scss" module>
.root {
}
</style>
