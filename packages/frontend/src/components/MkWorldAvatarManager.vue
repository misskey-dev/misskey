<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<MkPagination v-slot="{items}" :paginator="paginator">
			<div class="_gaps_s">
				<div v-for="avatar in items" :key="avatar.id">
					<div>{{ avatar.name }}</div>
					<div>{{ avatar.active }}</div>
					<MkButton small rounded iconOnly @click="editWorldAvatar($event, avatar)"><i class="ti ti-pencil"></i></MkButton>
					<MkButton small rounded iconOnly @click="makeActive($event, avatar)"><i class="ti ti-check"></i></MkButton>
				</div>
			</div>
		</MkPagination>
		<MkButton iconOnly rounded style="margin: 0 auto;" @click="createWorldAvatar"><i class="ti ti-plus"></i></MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { markRaw } from 'vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import MkButton from '@/components/MkButton.vue';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';
import { Paginator } from '@/utility/paginator.js';
import MkPagination from '@/components/MkPagination.vue';

const paginator = markRaw(new Paginator('world/avatars/list', {
	limit: 10,
}));

async function createWorldAvatar(ev: PointerEvent) {
	const { dispose } = await os.popupAsyncWithDialog(import('./MkWorldAvatarEditDialog.vue').then(x => x.default), {
		graphicsQuality: prefer.s['world.graphicsQuality'] ?? 0,
		avatar: null,
	}, {
		ok: async (res) => {
			await os.apiWithDialog('world/avatars/create', {
				name: res.name,
				def: res.avatar,
			});
			paginator.reload();
		},
		closed: () => {
			dispose();
		},
	});
}

async function editWorldAvatar(ev: PointerEvent, item: Misskey.entities.WorldAvatarsListResponse[number]) {
	const { dispose } = await os.popupAsyncWithDialog(import('./MkWorldAvatarEditDialog.vue').then(x => x.default), {
		graphicsQuality: prefer.s['world.graphicsQuality'] ?? 0,
		avatar: item.def,
		name: item.name,
	}, {
		ok: async (res) => {
			await os.apiWithDialog('world/avatars/update', {
				avatarId: item.id,
				name: res.name,
				def: res.avatar,
			});
			paginator.reload();
		},
		closed: () => {
			dispose();
		},
	});
}

async function makeActive(ev: PointerEvent, item: Misskey.entities.WorldAvatarsListResponse[number]) {
	await os.apiWithDialog('world/avatars/update', {
		avatarId: item.id,
		active: true,
	});
	paginator.reload();
}
</script>

<style module>
.root {
	position: relative;
}
</style>
