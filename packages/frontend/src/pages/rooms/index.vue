<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<MkButton gradate rounded @click="create">Create</MkButton>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import type { RoomState } from '@/world/room/engine.js';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { WORLD_SCALE } from 'misskey-world/src/utility.js';
import { useRouter } from '@/router.js';

const router = useRouter();

const initialRoomDef = {
	env: {
		type: 'simple',
		options: {
			dimension: [300, 300],
			window: 'demado',
			walls: {
				n: {
					material: null,
					color: [0.9, 0.9, 0.9],
					withBeam: false,
					beamMaterial: null,
					beamColor: [0.8, 0.8, 0.8],
					withBaseboard: true,
				},
				e: {
					material: null,
					color: [0.9, 0.9, 0.9],
					withBeam: false,
					beamMaterial: null,
					beamColor: [0.8, 0.8, 0.8],
					withBaseboard: true,
				},
				s: {
					material: null,
					color: [0.9, 0.9, 0.9],
					withBeam: false,
					beamMaterial: null,
					beamColor: [0.8, 0.8, 0.8],
					withBaseboard: true,
				},
				w: {
					material: null,
					color: [0.9, 0.9, 0.9],
					withBeam: false,
					beamMaterial: null,
					beamColor: [0.8, 0.8, 0.8],
					withBaseboard: true,
				},
			},
			pillars: {
				nw: {
					material: null,
					color: [0.9, 0.9, 0.9],
					show: false,
				},
				ne: {
					material: null,
					color: [0.9, 0.9, 0.9],
					show: false,
				},
				sw: {
					material: null,
					color: [0.9, 0.9, 0.9],
					show: false,
				},
				se: {
					material: null,
					color: [0.9, 0.9, 0.9],
					show: false,
				},
			},
			flooring: {
				material: 'wood',
				color: [0.9, 0.9, 0.9],
			},
			ceiling: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
		},
	},
	roomLightColor: [1.0, 0.9, 0.8],
	installedObjects: [],
	worldScale: WORLD_SCALE,
} satisfies RoomState;

async function create() {
	const room = await os.apiWithDialog('world/rooms/create', {
		name: 'test',
		def: initialRoomDef,
		visibility: 'public',
	});

	router.push('/rooms/:roomId', {
		params: {
			roomId: room.id,
		},
	});
}

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: i18n.ts.create,
	handler: () => {
		create();
	},
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: 'Room',
	icon: 'ti ti-door',
}));
</script>

<style lang="scss" module>
</style>
