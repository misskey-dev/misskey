<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="urbixznjwwuukfsckrwzwsqzsxornqij">
	<header><b><MkUserName :user="game.user1"/></b> vs <b><MkUserName :user="game.user2"/></b></header>

	<div>
		<p>{{ i18n.ts._reversi.gameSettings }}</p>

		<div class="card map _panel">
			<header>
				<select v-model="mapName" :placeholder="i18n.ts._reversi.chooseBoard" @change="onMapChange">
					<option v-if="mapName == '-Custom-'" label="-Custom-" :value="mapName"/>
					<option :label="i18n.ts.random" :value="null"/>
					<optgroup v-for="c in mapCategories" :key="c" :label="c">
						<option v-for="m in Object.values(Reversi.maps).filter(m => m.category == c)" :key="m.name" :label="m.name" :value="m.name">{{ m.name }}</option>
					</optgroup>
				</select>
			</header>

			<div>
				<div v-if="game.map == null" class="random"><i class="ti ti-dice"></i></div>
				<div v-else class="board" :style="{ 'grid-template-rows': `repeat(${ game.map.length }, 1fr)`, 'grid-template-columns': `repeat(${ game.map[0].length }, 1fr)` }">
					<div v-for="(x, i) in game.map.join('')" :class="{ none: x == ' ' }" @click="onMapCellClick(i, x)">
						<i v-if="x === 'b'" class="ti ti-circle-filled"></i>
						<i v-if="x === 'w'" class="ti ti-circle"></i>
					</div>
				</div>
			</div>
		</div>

		<div class="card _panel">
			<header>
				<span>{{ i18n.ts._reversi.blackOrWhite }}</span>
			</header>

			<div>
				<MkRadio v-model="game.bw" value="random" @update:modelValue="updateSettings('bw')">{{ i18n.ts.random }}</MkRadio>
				<MkRadio v-model="game.bw" :value="'1'" @update:modelValue="updateSettings('bw')">
					<I18n :src="i18n.ts._reversi.blackIs" tag="span">
						<template #name>
							<b><MkUserName :user="game.user1"/></b>
						</template>
					</I18n>
				</MkRadio>
				<MkRadio v-model="game.bw" :value="'2'" @update:modelValue="updateSettings('bw')">
					<I18n :src="i18n.ts._reversi.blackIs" tag="span">
						<template #name>
							<b><MkUserName :user="game.user2"/></b>
						</template>
					</I18n>
				</MkRadio>
			</div>
		</div>

		<div class="card _panel">
			<header>
				<span>{{ i18n.ts._reversi.rules }}</span>
			</header>

			<div>
				<MkSwitch v-model="game.isLlotheo" @update:modelValue="updateSettings('isLlotheo')">{{ i18n.ts._reversi.isLlotheo }}</MkSwitch>
				<MkSwitch v-model="game.loopedBoard" @update:modelValue="updateSettings('loopedBoard')">{{ i18n.ts._reversi.loopedMap }}</MkSwitch>
				<MkSwitch v-model="game.canPutEverywhere" @update:modelValue="updateSettings('canPutEverywhere')">{{ i18n.ts._reversi.canPutEverywhere }}</MkSwitch>
			</div>
		</div>
	</div>

	<footer class="_acrylic">
		<p class="status">
			<template v-if="isAccepted && isOpAccepted">{{ i18n.ts._reversi.thisGameIsStartedSoon }}<MkEllipsis/></template>
			<template v-if="isAccepted && !isOpAccepted">{{ i18n.ts._reversi.waitingForOther }}<MkEllipsis/></template>
			<template v-if="!isAccepted && isOpAccepted">{{ i18n.ts._reversi.waitingForMe }}</template>
			<template v-if="!isAccepted && !isOpAccepted">{{ i18n.ts._reversi.waitingBoth }}<MkEllipsis/></template>
		</p>

		<div class="actions">
			<MkButton inline @click="exit">{{ i18n.ts.cancel }}</MkButton>
			<MkButton v-if="!isAccepted" inline primary @click="accept">{{ i18n.ts._reversi.ready }}</MkButton>
			<MkButton v-if="isAccepted" inline primary @click="cancel">{{ i18n.ts._reversi.cancelReady }}</MkButton>
		</div>
	</footer>
</div>
</template>

<script lang="ts" setup>
import { computed, watch, ref, onMounted, shallowRef, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import * as Reversi from 'misskey-reversi';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { signinRequired } from '@/account.js';

const $i = signinRequired();

const mapCategories = Array.from(new Set(Object.values(Reversi.maps).map(x => x.category)));

const props = defineProps<{
		game: Misskey.entities.ReversiGameDetailed;
		connection: Misskey.ChannelConnection;
	}>();

const game = ref<Misskey.entities.ReversiGameDetailed>(props.game);
const isLlotheo = ref<boolean>(false);
const mapName = ref<string>(Reversi.maps.eighteight.name!);
const isAccepted = computed(() => {
	if (game.value.user1Id === $i.id && game.value.user1Accepted) return true;
	if (game.value.user2Id === $i.id && game.value.user2Accepted) return true;
	return false;
});
const isOpAccepted = computed(() => {
	if (game.value.user1Id !== $i.id && game.value.user1Accepted) return true;
	if (game.value.user2Id !== $i.id && game.value.user2Accepted) return true;
	return false;
});

function exit() {
	props.connection.send('exit', {});
}

function accept() {
	props.connection.send('accept', {});
}

function cancel() {
	props.connection.send('cancelAccept', {});
}

function onChangeAcceptingStates(acceptingStates) {
	game.value.user1Accepted = acceptingStates.user1;
	game.value.user2Accepted = acceptingStates.user2;
}

function updateSettings(key: keyof Misskey.entities.ReversiGameDetailed) {
	props.connection.send('updateSettings', {
		key: key,
		value: game.value[key],
	});
}

function onUpdateSettings({ key, value }: { key: keyof Misskey.entities.ReversiGameDetailed; value: any; }) {
	game.value[key] = value;
	if (game.value.map == null) {
		mapName.value = null;
	} else {
		const found = Object.values(Reversi.maps).find(x => x.data.join('') === game.value.map.join(''));
		mapName.value = found ? found.name! : '-Custom-';
	}
}

function onMapChange() {
	if (mapName.value == null) {
		game.value.map = null;
	} else {
		game.value.map = Object.values(Reversi.maps).find(x => x.name === mapName.value)!.data;
	}
	updateSettings('map');
}

function onMapCellClick(pos: number, pixel: string) {
	const x = pos % game.value.map[0].length;
	const y = Math.floor(pos / game.value.map[0].length);
	const newPixel =
		pixel === ' ' ? '-' :
		pixel === '-' ? 'b' :
		pixel === 'b' ? 'w' :
		' ';
	const line = game.value.map[y].split('');
	line[x] = newPixel;
	game.value.map[y] = line.join('');
	updateSettings('map');
}

props.connection.on('changeAcceptingStates', onChangeAcceptingStates);
props.connection.on('updateSettings', onUpdateSettings);

onUnmounted(() => {
	props.connection.off('changeAcceptingStates', onChangeAcceptingStates);
	props.connection.off('updateSettings', onUpdateSettings);
});
</script>
