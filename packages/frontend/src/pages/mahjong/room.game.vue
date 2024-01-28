<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.taku">
		<div :class="$style.handTilesOfToimen">
			<div v-for="tile in engine.getHandTilesOf(Mahjong.Utils.prevHouse(Mahjong.Utils.prevHouse(engine.myHouse)))" style="display: inline-block;">
				<img :src="`/client-assets/mahjong/tile-back.png`" style="display: inline-block; width: 32px;"/>
			</div>
		</div>

		<div :class="$style.handTilesOfKamitya">
			<div v-for="tile in engine.getHandTilesOf(Mahjong.Utils.prevHouse(engine.myHouse))" :class="$style.sideTile">
				<img :src="`/client-assets/mahjong/tile-side.png`" style="display: inline-block; width: 32px;"/>
			</div>
		</div>

		<div :class="$style.handTilesOfSimotya">
			<div v-for="tile in engine.getHandTilesOf(Mahjong.Utils.nextHouse(engine.myHouse))" :class="$style.sideTile">
				<img :src="`/client-assets/mahjong/tile-side.png`" style="display: inline-block; width: 32px; scale: -1 1;"/>
			</div>
		</div>

		<div :class="$style.hoTilesContainer">
			<div :class="$style.hoTilesContainerOfToimen">
				<div :class="$style.hoTilesOfToimen">
					<div v-for="tile in engine.getHoTilesOf(Mahjong.Utils.prevHouse(Mahjong.Utils.prevHouse(engine.myHouse)))" :class="$style.hoTile">
						<img :src="`/client-assets/mahjong/tiles/${tile}.png`" style="position: absolute; width: 100%;"/>
					</div>
				</div>
			</div>
			<div :class="$style.hoTilesContainerOfKamitya">
				<div :class="$style.hoTilesOfKamitya">
					<div v-for="tile in engine.getHoTilesOf(Mahjong.Utils.prevHouse(engine.myHouse))" :class="$style.hoTile">
						<img :src="`/client-assets/mahjong/tiles/${tile}.png`" style="position: absolute; width: 100%;"/>
					</div>
				</div>
			</div>
			<div :class="$style.hoTilesContainerOfSimotya">
				<div :class="$style.hoTilesOfSimotya">
					<div v-for="tile in engine.getHoTilesOf(Mahjong.Utils.nextHouse(engine.myHouse))" :class="$style.hoTile">
						<img :src="`/client-assets/mahjong/tiles/${tile}.png`" style="position: absolute; width: 100%;"/>
					</div>
				</div>
			</div>
			<div :class="$style.hoTilesContainerOfMe">
				<div :class="$style.hoTilesOfMe">
					<div v-for="tile in engine.myHoTiles" :class="$style.hoTile">
						<img :src="`/client-assets/mahjong/tiles/${tile}.png`" style="position: absolute; width: 100%;"/>
					</div>
				</div>
			</div>
		</div>

		<div :class="$style.handTilesOfMe">
			<div v-for="tile in Mahjong.Utils.sortTiles((isMyTurn && iTsumoed) ? engine.myHandTiles.slice(0, engine.myHandTiles.length - 1) : engine.myHandTiles)" :class="$style.myTile" @click="dahai(tile, $event)">
				<img :src="`/client-assets/mahjong/tile-front.png`" :class="$style.myTileBg"/>
				<img :src="`/client-assets/mahjong/tiles/${tile}.png`" :class="$style.myTileFg"/>
			</div>
			<div v-if="isMyTurn && iTsumoed" style="display: inline-block; margin-left: 5px;" :class="$style.myTile" @click="dahai(engine.myHandTiles.at(-1), $event)">
				<img :src="`/client-assets/mahjong/tile-front.png`" :class="$style.myTileBg"/>
				<img :src="`/client-assets/mahjong/tiles/${engine.myHandTiles.at(-1)}.png`" :class="$style.myTileFg"/>
			</div>
		</div>

		<div :class="$style.huroTilesOfMe">
			<div v-for="huro in engine.getHurosOf(engine.myHouse)" style="display: inline-block;">
				<div v-if="huro.type === 'pon'">
					<img :src="`/client-assets/mahjong/tiles/${huro.tile}.png`"/>
					<img :src="`/client-assets/mahjong/tiles/${huro.tile}.png`"/>
					<img :src="`/client-assets/mahjong/tiles/${huro.tile}.png`"/>
				</div>
			</div>
		</div>
	</div>
	<MkButton v-if="engine.state.canPonSource != null" @click="pon">Pon</MkButton>
	<MkButton v-if="engine.state.canPonSource != null" @click="skip">Skip pon</MkButton>
	<MkButton v-if="isMyTurn && canHora">Hora</MkButton>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import * as Mahjong from 'misskey-mahjong';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { deepClone } from '@/scripts/clone.js';
import { useInterval } from '@/scripts/use-interval.js';
import { signinRequired } from '@/account.js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { userPage } from '@/filters/user.js';
import * as sound from '@/scripts/sound.js';
import * as os from '@/os.js';
import { confetti } from '@/scripts/confetti.js';

const $i = signinRequired();

const props = defineProps<{
	room: Misskey.entities.MahjongRoomDetailed;
	connection?: Misskey.ChannelConnection | null;
}>();

const room = ref<Misskey.entities.MahjongRoomDetailed>(deepClone(props.room));
const myUserNumber = computed(() => room.value.user1Id === $i.id ? 1 : room.value.user2Id === $i.id ? 2 : room.value.user3Id === $i.id ? 3 : 4);
const engine = shallowRef(new Mahjong.Engine.PlayerGameEngine(myUserNumber.value, room.value.gameState));

const isMyTurn = computed(() => {
	return engine.value.state.turn === engine.value.myHouse;
});

const canHora = computed(() => {
	return Mahjong.Utils.getHoraSets(engine.value.myHandTiles).length > 0;
});

/*
console.log(Mahjong.Utils.getHoraSets([
	'm3',
	'm3',
	'm4',
	'm4',
	'm5',
	'm5',
	'p4',
	'p4',
	'p7',
	'p8',
	'p9',
	's4',
	's5',
	's6',
]));
*/

/*
if (room.value.isStarted && !room.value.isEnded) {
	useInterval(() => {
		if (room.value.isEnded) return;
		const crc32 = engine.value.calcCrc32();
		if (_DEV_) console.log('crc32', crc32);
		misskeyApi('reversi/verify', {
			roomId: room.value.id,
			crc32: crc32.toString(),
		}).then((res) => {
			if (res.desynced) {
				console.log('resynced');
				restoreRoom(res.room!);
			}
		});
	}, 10000, { immediate: false, afterMounted: true });
}
*/

const myTurnTimerRmain = ref<number>(room.value.timeLimitForEachTurn);

/*
const TIMER_INTERVAL_SEC = 3;
if (!props.room.isEnded) {
	useInterval(() => {
		if (myTurnTimerRmain.value > 0) {
			myTurnTimerRmain.value = Math.max(0, myTurnTimerRmain.value - TIMER_INTERVAL_SEC);
		}
		if (opTurnTimerRmain.value > 0) {
			opTurnTimerRmain.value = Math.max(0, opTurnTimerRmain.value - TIMER_INTERVAL_SEC);
		}

		if (iAmPlayer.value) {
			if ((isMyTurn.value && myTurnTimerRmain.value === 0) || (!isMyTurn.value && opTurnTimerRmain.value === 0)) {
			props.connection!.send('claimTimeIsUp', {});
			}
		}
	}, TIMER_INTERVAL_SEC * 1000, { immediate: false, afterMounted: true });
}
*/

function dahai(tile: Mahjong.Common.Tile, ev: MouseEvent) {
	if (!isMyTurn.value) return;

	engine.value.op_dahai(engine.value.myHouse, tile);
	iTsumoed.value = false;
	triggerRef(engine);

	props.connection!.send('dahai', {
		tile: tile,
	});
}

function pon() {
	engine.value.op_pon(engine.value.state.canPonSource, engine.value.myHouse);
	triggerRef(engine);

	props.connection!.send('pon', {
	});
}

function skip() {
	engine.value.op_nop(engine.value.myHouse);
	triggerRef(engine);

	props.connection!.send('nop', {});
}

const iTsumoed = ref(false);

function onStreamDahai(log) {
	console.log('onStreamDahai', log);

	if (log.house === engine.value.myHouse) return;

	sound.playUrl('/client-assets/mahjong/dahai.mp3', {
		volume: 1,
		playbackRate: 1,
	});

	//if (log.house !== engine.value.state.turn) { // = desyncが発生している
	//	const _room = await misskeyApi('mahjong/show-room', {
	//		roomId: props.room.id,
	//	});
	//	restoreRoom(_room);
	//	return;
	//}

	engine.value.op_dahai(log.house, log.tile);
	triggerRef(engine);

	myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
}

function onStreamTsumo(log) {
	console.log('onStreamTsumo', log);

	//if (log.house !== engine.value.state.turn) { // = desyncが発生している
	//	const _room = await misskeyApi('mahjong/show-room', {
	//		roomId: props.room.id,
	//	});
	//	restoreRoom(_room);
	//	return;
	//}

	engine.value.op_tsumo(log.house, log.tile);
	triggerRef(engine);

	if (log.house === engine.value.myHouse) {
		iTsumoed.value = true;
	}

	myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
}

function onStreamDahaiAndTsumo(log) {
	console.log('onStreamDahaiAndTsumo', log);

	//if (log.house !== engine.value.state.turn) { // = desyncが発生している
	//	const _room = await misskeyApi('mahjong/show-room', {
	//		roomId: props.room.id,
	//	});
	//	restoreRoom(_room);
	//	return;
	//}

	if (log.dahaiHouse !== engine.value.myHouse) {
		engine.value.op_dahai(log.dahaiHouse, log.dahaiTile);
		triggerRef(engine);
	}

	window.setTimeout(() => {
		engine.value.op_tsumo(Mahjong.Utils.nextHouse(log.dahaiHouse), log.tsumoTile);
		triggerRef(engine);

		if (Mahjong.Utils.nextHouse(log.dahaiHouse) === engine.value.myHouse) {
			iTsumoed.value = true;
		}
	}, 100);

	myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
}

function onStreamPonned(log) {
	console.log('onStreamPonned', log);

	//if (log.house !== engine.value.state.turn) { // = desyncが発生している
	//	const _room = await misskeyApi('mahjong/show-room', {
	//		roomId: props.room.id,
	//	});
	//	restoreRoom(_room);
	//	return;
	//}

	if (log.target === engine.value.myHouse) return;

	engine.value.op_pon(log.source, log.target);
	triggerRef(engine);

	myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
}

function restoreRoom(_room) {
	room.value = deepClone(_room);

	engine.value = new Mahjong.Engine.PlayerGameEngine(myUserNumber, room.value.gameState);
}

onMounted(() => {
	if (props.connection != null) {
		props.connection.on('dahai', onStreamDahai);
		props.connection.on('tsumo', onStreamTsumo);
		props.connection.on('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.on('ponned', onStreamPonned);
	}
});

onActivated(() => {
	if (props.connection != null) {
		props.connection.on('dahai', onStreamDahai);
		props.connection.on('tsumo', onStreamTsumo);
		props.connection.on('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.on('ponned', onStreamPonned);
	}
});

onDeactivated(() => {
	if (props.connection != null) {
		props.connection.off('dahai', onStreamDahai);
		props.connection.off('tsumo', onStreamTsumo);
		props.connection.off('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.off('ponned', onStreamPonned);
	}
});

onUnmounted(() => {
	if (props.connection != null) {
		props.connection.off('dahai', onStreamDahai);
		props.connection.off('tsumo', onStreamTsumo);
		props.connection.off('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.off('ponned', onStreamPonned);
	}
});
</script>

<style lang="scss" module>
.root {
	background: #3C7A43;
	padding: 30px;
}

.taku {
	position: relative;
	width: 100%;
	height: 100%;
	max-width: 800px;
	min-height: 600px;
	margin: auto;
	box-sizing: border-box;
}

.handTilesOfToimen {
	position: absolute;
	top: 0;
	left: 80px;
}

.handTilesOfKamitya {
	position: absolute;
	top: 80px;
	left: 0;
}

.handTilesOfSimotya {
	position: absolute;
	top: 80px;
	right: 0;
}

.handTilesOfMe {
	position: absolute;
	bottom: 0;
	left: 80px;
}

.huroTilesOfMe {
	position: absolute;
	bottom: 0;
	right: 80px;
}

.hoTilesContainer {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	transform-origin: center;
	scale: 0.8;
}

.hoTilesContainerOfToimen {
	position: absolute;
	bottom: calc(50% + 100px);
	left: 0;
	right: 0;
	margin: auto;
	width: min-content;
}
.hoTilesOfToimen {
	rotate: 180deg;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
}

.hoTilesContainerOfKamitya {
	position: absolute;
	right: calc(50% + 100px);
	top: 0;
	bottom: 0;
	margin: auto;
	height: min-content;
}
.hoTilesOfKamitya {
	rotate: 90deg;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
	grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;
	aspect-ratio: 1;
}

.hoTilesContainerOfSimotya {
	position: absolute;
	left: calc(50% + 100px);
	top: 0;
	bottom: 0;
	margin: auto;
	height: min-content;
}
.hoTilesOfSimotya {
	rotate: -90deg;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
	grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;
	aspect-ratio: 1;
}

.hoTilesContainerOfMe {
	position: absolute;
	top: calc(50% + 100px);
	left: 0;
	right: 0;
	margin: auto;
	width: min-content;
}
.hoTilesOfMe {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
}

.sideTile {
	margin-bottom: -26px;
}

.hoTile {
	position: relative;
	display: inline-block;
	width: 32px;
	aspect-ratio: 0.7;
	background: #fff;
	margin-bottom: -8px;
}

.myTile {
	display: inline-block;
	position: relative;
	width: 35px;
	aspect-ratio: 0.7;
}
.myTileBg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
}
.myTileFg {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 70%;
	object-fit: contain;
}
</style>
