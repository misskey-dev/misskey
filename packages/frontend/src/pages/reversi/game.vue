<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="game == null || connection == null"><MkLoading/></div>
<GameSetting v-else-if="!game.isStarted" :game="game" :connection="connection"/>
<GameBoard v-else :game="game" :connection="connection"/>
</template>

<script lang="ts" setup>
import { computed, watch, ref, onMounted, shallowRef, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import GameSetting from './game.setting.vue';
import GameBoard from './game.board.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { useStream } from '@/stream.js';

const props = defineProps<{
	gameId: string;
}>();

const game = shallowRef<Misskey.entities.ReversiGameDetailed | null>(null);
const connection = shallowRef<Misskey.ChannelConnection | null>(null);

watch(() => props.gameId, () => {
	fetchGame();
});

async function fetchGame() {
	const _game = await misskeyApi('reversi/show-game', {
		gameId: props.gameId,
	});

	game.value = _game;

	if (connection.value) {
		connection.value.dispose();
	}
	connection.value = useStream().useChannel('reversiGame', {
		gameId: game.value.id,
	});
	connection.value.on('started', x => {
		game.value = x.game;
	});
}

onMounted(() => {
	fetchGame();
});

onUnmounted(() => {
	if (connection.value) {
		connection.value.dispose();
	}
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(computed(() => ({
	title: 'Reversi',
	icon: 'ti ti-device-gamepad',
})));
</script>
