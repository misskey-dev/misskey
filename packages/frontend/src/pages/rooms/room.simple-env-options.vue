<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<MkSelect
			:items="[
				{ label: '腰高窓', value: 'kosidakamado' },
				{ label: '出窓', value: 'demado' },
			]" :modelValue="options.window" @update:modelValue="v => { update({ window: v }); }"
		>
			<template #label>window</template>
		</MkSelect>

		<MkFolder>
			<template #label>Walls</template>

			<div class="_gaps_s">
				<MkFolder>
					<template #label>Wall S</template>
					<XWallOption :options="options.walls.zPositive" @update="v => { update({ walls: { ...options.walls, zPositive: v } }); }"></XWallOption>
				</MkFolder>

				<MkFolder>
					<template #label>Wall N</template>
					<XWallOption :options="options.walls.zNegative" @update="v => { update({ walls: { ...options.walls, zNegative: v } }); }"></XWallOption>
				</MkFolder>

				<MkFolder>
					<template #label>Wall W</template>
					<XWallOption :options="options.walls.xPositive" @update="v => { update({ walls: { ...options.walls, xPositive: v } }); }"></XWallOption>
				</MkFolder>

				<MkFolder>
					<template #label>Wall E</template>
					<XWallOption :options="options.walls.xNegative" @update="v => { update({ walls: { ...options.walls, xNegative: v } }); }"></XWallOption>
				</MkFolder>
			</div>
		</MkFolder>

		<MkFolder>
			<template #label>Pillars</template>

			<div class="_gaps_s">
				<MkFolder>
					<template #label>Pillar SW</template>
					<XPillarOption :options="options.pillars.zp_xp" @update="v => { update({ pillars: { ...options.pillars, zp_xp: v } }); }"></XPillarOption>
				</MkFolder>

				<MkFolder>
					<template #label>Pillar SE</template>
					<XPillarOption :options="options.pillars.zp_xn" @update="v => { update({ pillars: { ...options.pillars, zp_xn: v } }); }"></XPillarOption>
				</MkFolder>

				<MkFolder>
					<template #label>Pillar NW</template>
					<XPillarOption :options="options.pillars.zn_xp" @update="v => { update({ pillars: { ...options.pillars, zn_xp: v } }); }"></XPillarOption>
				</MkFolder>

				<MkFolder>
					<template #label>Pillar NE</template>
					<XPillarOption :options="options.pillars.zn_xn" @update="v => { update({ pillars: { ...options.pillars, zn_xn: v } }); }"></XPillarOption>
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
			<!-- debounce or throttleしないとカラーピッカー上で高速でなぞったときになぜか無限ループになる。ワーカーとの間でラグがあるため、少し前の値がまたmodelValueとしてフィードバックされてしまうためだと思われる -->
			<MkInput :modelValue="getHex(options.ceiling.color)" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) update({ ceiling: { ...options.ceiling, color: c } }); }">
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
			<!-- debounce or throttleしないとカラーピッカー上で高速でなぞったときになぜか無限ループになる。ワーカーとの間でラグがあるため、少し前の値がまたmodelValueとしてフィードバックされてしまうためだと思われる -->
			<MkInput :modelValue="getHex(options.flooring.color)" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) update({ flooring: { ...options.flooring, color: c } }); }">
				<template #label>color</template>
			</MkInput>
		</MkFolder>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { getHex, getRgb } from 'misskey-world/src/utility.js';
import XWallOption from './room.simple-env-wall-options.vue';
import XPillarOption from './room.simple-env-pillar-options.vue';
import type { SimpleEnvOptions } from 'misskey-world/src/room/env.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import MkFolder from '@/components/MkFolder.vue';

const props = defineProps<{
	options: SimpleEnvOptions;
}>();

const emit = defineEmits<{
	(ev: 'update', v: SimpleEnvOptions): void;
}>();

function update(v: Partial<SimpleEnvOptions>) {
	emit('update', { ...props.options, ...v });
}
</script>

<style lang="scss" module>
.root {
}
</style>
