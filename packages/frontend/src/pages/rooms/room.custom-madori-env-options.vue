<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<div :class="$style.cells" :style="cellsStyle">
			<div
				v-for="(_, i) in options.units"
				:key="i"
				:class="[$style.cell, {
					[$style.cell_active]: activeCellIndex === i,
					[$style.cell_empty]: options.units[cellIndexToUnitIndex(i)] == null,
				}]"
				@click="activeCellIndex = i"
			>
			</div>
		</div>

		<div v-if="activeUnitIndex != null">
			<MkSelect
				:items="[
					{ label: 'Empty', value: null },
					{ label: 'Floor', value: 'floor' },
				]" :modelValue="options.units[activeUnitIndex]?.type ?? null" @update:modelValue="v => updateUnitType(activeUnitIndex!, v)"
			>
				<template #label>type</template>
			</MkSelect>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { getHex, getRgb } from 'misskey-world/src/utility.js';
import { throttle } from 'throttle-debounce';
import XWallOption from './room.simple-env-wall-options.vue';
import XPillarOption from './room.simple-env-pillar-options.vue';
import type { CustomMadoriEnvOptions } from 'misskey-world/src/room/env.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import MkFolder from '@/components/MkFolder.vue';
import { deepClone } from '@/utility/clone.js';

const dimensions = [15, 15];

function indexToPos(index: number): [number, number] {
	const z = Math.floor(index / dimensions[0]);
	const x = index % dimensions[0];
	return [x, z];
}

function posToIndex(x: number, z: number): number {
	if (x < 0 || z < 0 || x >= dimensions[0] || z >= dimensions[1]) return -1;
	return x + (dimensions[0] * z);
}

const cellIndexToUnitIndex = (index: number) => {
	const [x, z] = indexToPos(index);
	return posToIndex(x, dimensions[1] - 1 - z);
};

const props = defineProps<{
	options: CustomMadoriEnvOptions;
}>();

const emit = defineEmits<{
	(ev: 'update', v: CustomMadoriEnvOptions): void;
}>();

const cellsStyle = computed(() => {
	return {
		'grid-template-rows': `repeat(${dimensions[0]}, 1fr)`,
		'grid-template-columns': `repeat(${dimensions[1]}, 1fr)`,
	};
});

const activeCellIndex = ref<number | null>(null);
const activeUnitIndex = computed(() => {
	if (activeCellIndex.value == null) return null;
	return cellIndexToUnitIndex(activeCellIndex.value);
});

const update = throttle(1000, (v: Partial<CustomMadoriEnvOptions>) => {
	emit('update', { ...props.options, ...v });
});

function updateUnitType(index: number, type: 'floor' | null) {
	const units = deepClone(props.options.units);
	if (type == null) {
		units[index] = null;
	} else if (type === 'floor') {
		units[index] = {
			type: 'floor',
		};
	}
	update({ units });
}
</script>

<style lang="scss" module>
.root {
}

.cells {
	width: 100%;
	display: grid;
	grid-gap: 2px;
	background: #000;
}

.cell {
	background: #fff;
	aspect-ratio: 1 / 1;
}
.cell_active {
	outline: solid 2px var(--MI_THEME-accent);
}
.cell_empty {
	background: #333;
}
</style>
