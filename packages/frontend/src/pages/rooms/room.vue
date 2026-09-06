<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<XCore v-if="room" :room="room"/>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import XCore from './room.core.vue';
import { definePage } from '@/page.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const props = defineProps<{
	roomId: string;
}>();

const room = shallowRef<Misskey.entities.WorldRoomDetailed | null>(null);
const fetchError = ref<unknown | null>(null);

function fetchRoom(): void {
	misskeyApi('world/rooms/show', {
		roomId: props.roomId,
	}).then(_room => {
		room.value = _room;
	}).catch(err => {
		fetchError.value = err;
	});
}

fetchRoom();

definePage(() => ({
	title: 'Room',
	icon: 'ti ti-door',
	needWideArea: true,
}));
</script>

<style lang="scss" module>
.root {
	height: 100%;
	overflow: clip;
	background: var(--MI_THEME-bg);
}
</style>
