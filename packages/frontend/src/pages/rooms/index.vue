<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<MkButton gradate rounded @click="create">Create</MkButton>

		<MkPagination v-slot="{items}" :paginator="paginator">
			<div class="_gaps_s">
				<div v-for="room in items" :key="room.id">
					<MkA :to="'/rooms/r/' + room.id">
						<div>{{ room.name }}</div>
					</MkA>
				</div>
			</div>
		</MkPagination>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { WORLD_SCALE } from 'misskey-world/src/utility.js';
import { getDefaultSimpleEnvOptions } from 'misskey-world/src/room/env.js';
import type { RoomState } from 'misskey-world/src/room/type.js';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useRouter } from '@/router.js';
import { Paginator } from '@/utility/paginator.js';
import MkPagination from '@/components/MkPagination.vue';
import MkLink from '@/components/MkLink.vue';

const $i = ensureSignin();

const router = useRouter();

const paginator = markRaw(new Paginator('world/rooms/list-by-user', {
	limit: 10,
	params: {
		userId: $i.id,
	},
}));

const initialRoomDef = {
	env: {
		type: 'simple',
		options: getDefaultSimpleEnvOptions(),
	},
	roomLightColor: [1.0, 0.9, 0.8],
	installedFurnitures: [],
	worldScale: WORLD_SCALE,
} satisfies RoomState;

async function create() {
	const room = await os.apiWithDialog('world/rooms/create', {
		name: 'test',
		def: initialRoomDef,
		visibility: 'public',
	});

	router.push('/rooms/r/:roomId', {
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
	title: 'Rooms',
	icon: 'ti ti-door',
}));
</script>

<style lang="scss" module>
</style>
