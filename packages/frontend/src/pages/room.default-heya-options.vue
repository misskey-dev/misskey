<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<MkFolder>
			<template #label>Walls</template>

			<div class="_gaps_s">
				<MkFolder>
					<template #label>Wall N</template>
					<XWallOption :options="options.walls.n" @update="v => { update({ walls: { ...options.walls, n: v } }); }"></XWallOption>
				</MkFolder>

				<MkFolder>
					<template #label>Wall S</template>
					<XWallOption :options="options.walls.s" @update="v => { update({ walls: { ...options.walls, s: v } }); }"></XWallOption>
				</MkFolder>

				<MkFolder>
					<template #label>Wall W</template>
					<XWallOption :options="options.walls.w" @update="v => { update({ walls: { ...options.walls, w: v } }); }"></XWallOption>
				</MkFolder>

				<MkFolder>
					<template #label>Wall E</template>
					<XWallOption :options="options.walls.e" @update="v => { update({ walls: { ...options.walls, e: v } }); }"></XWallOption>
				</MkFolder>
			</div>
		</MkFolder>

		<MkFolder>
			<template #label>Pillars</template>

			<div class="_gaps_s">
				<MkFolder>
					<template #label>Pillar NW</template>
					<XPillarOption :options="options.pillars.nw" @update="v => { update({ pillars: { ...options.pillars, nw: v } }); }"></XPillarOption>
				</MkFolder>

				<MkFolder>
					<template #label>Pillar NE</template>
					<XPillarOption :options="options.pillars.ne" @update="v => { update({ pillars: { ...options.pillars, ne: v } }); }"></XPillarOption>
				</MkFolder>

				<MkFolder>
					<template #label>Pillar SW</template>
					<XPillarOption :options="options.pillars.sw" @update="v => { update({ pillars: { ...options.pillars, sw: v } }); }"></XPillarOption>
				</MkFolder>

				<MkFolder>
					<template #label>Pillar SE</template>
					<XPillarOption :options="options.pillars.se" @update="v => { update({ pillars: { ...options.pillars, se: v } }); }"></XPillarOption>
				</MkFolder>
			</div>
		</MkFolder>

		<MkFolder>
			<template #label>Ceiling</template>
			<MkSelect
				:items="[
					{ label: 'None', value: null },
					{ label: 'Wood', value: 'wood' },
					{ label: 'Concrete', value: 'concrete' },
				]" :modelValue="options.ceiling.material" @update:modelValue="v => { update({ ceiling: { ...options.ceiling, material: v } }); }"
			>
				<template #label>wallpaper</template>
			</MkSelect>
			<MkInput :modelValue="getHex(options.ceiling.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) update({ ceiling: { ...options.ceiling, color: c } }); }">
				<template #label>color</template>
			</MkInput>
		</MkFolder>

		<MkFolder>
			<template #label>Flooring</template>
			<MkSelect
				:items="[
					{ label: 'None', value: null },
					{ label: 'Wood', value: 'wood' },
					{ label: 'Concrete', value: 'concrete' },
				]" :modelValue="options.flooring.material" @update:modelValue="v => { update({ flooring: { ...options.flooring, material: v } }); }"
			>
				<template #label>material</template>
			</MkSelect>
			<MkInput :modelValue="getHex(options.flooring.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) update({ flooring: { ...options.flooring, color: c } }); }">
				<template #label>color</template>
			</MkInput>
		</MkFolder>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import XWallOption from './room.default-heya-wall-options.vue';
import XPillarOption from './room.default-heya-pillar-options.vue';
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

function update(v: Partial<SimpleHeyaOptions>) {
	emit('update', { ...props.options, ...v });
}
</script>

<style lang="scss" module>
.root {
}
</style>
