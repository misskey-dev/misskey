<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="500">
	<div class="_gaps">
		<div>
			{{ engine.myHouse }} {{ engine.state.turn }}
		</div>
		<div class="_panel">
			<div>{{ Mahjong.Utils.prevHouse(Mahjong.Utils.prevHouse(Mahjong.Utils.prevHouse(engine.myHouse))) }} ho</div>
			<div v-for="tile in engine.getHoTilesOf(Mahjong.Utils.prevHouse(Mahjong.Utils.prevHouse(Mahjong.Utils.prevHouse(engine.myHouse))))" style="display: inline-block;">
				<img :src="`/client-assets/mahjong/tiles/${tile}.gif`"/>
			</div>
		</div>
		<div class="_panel">
			<div>{{ Mahjong.Utils.prevHouse(Mahjong.Utils.prevHouse(engine.myHouse)) }} ho</div>
			<div v-for="tile in engine.getHoTilesOf(Mahjong.Utils.prevHouse(Mahjong.Utils.prevHouse(engine.myHouse)))" style="display: inline-block;">
				<img :src="`/client-assets/mahjong/tiles/${tile}.gif`"/>
			</div>
		</div>
		<div class="_panel">
			<div>{{ Mahjong.Utils.prevHouse(engine.myHouse) }} ho</div>
			<div v-for="tile in engine.getHoTilesOf(Mahjong.Utils.prevHouse(engine.myHouse))" style="display: inline-block;">
				<img :src="`/client-assets/mahjong/tiles/${tile}.gif`"/>
			</div>
		</div>
		<div class="_panel">
			<div>{{ engine.myHouse }} ho</div>
			<div v-for="tile in engine.myHoTiles" style="display: inline-block;">
				<img :src="`/client-assets/mahjong/tiles/${tile}.gif`"/>
			</div>
		</div>

		<div class="_panel">
			<div>My hand</div>
			<div v-for="tile in Mahjong.Utils.sortTiles(engine.myHandTiles)" style="display: inline-block;" @click="dahai(tile, $event)">
				<img :src="`/client-assets/mahjong/tiles/${tile}.gif`"/>
			</div>
			<MkButton v-if="engine.state.canPon" @click="pon">Pon</MkButton>
			<MkButton v-if="engine.state.canPon" @click="skip">Skip pon</MkButton>
			<MkButton v-if="isMyTurn && canHora">Hora</MkButton>
		</div>
	</div>
</MkSpacer>
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

const appliedOps: string[] = [];

const myTurnTimerRmain = ref<number>(room.value.timeLimitForEachTurn);
const opTurnTimerRmain = ref<number>(room.value.timeLimitForEachTurn);

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

	const id = Math.random().toString(36).slice(2);
	appliedOps.push(id);
	props.connection!.send('dahai', {
		tile: tile,
		id,
	});
}

function pon() {
	engine.value.op_pon(engine.value.canPonTo, engine.value.myHouse);

	const id = Math.random().toString(36).slice(2);
	appliedOps.push(id);
	props.connection!.send('pon', {
		id,
	});
}

function skip() {
	engine.value.op_nop(engine.value.myHouse);

	const id = Math.random().toString(36).slice(2);
	appliedOps.push(id);
	props.connection!.send('nop', {});
}

async function onStreamLog(log) {
	if (log.id == null || !appliedOps.includes(log.id)) {
		switch (log.operation) {
			case 'dahai': {
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
				opTurnTimerRmain.value = room.value.timeLimitForEachTurn;
				break;
			}

			case 'dahaiAndTsumo': {
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

				engine.value.op_dahai(log.house, log.dahaiTile);
				triggerRef(engine);

				window.setTimeout(() => {
					engine.value.op_tsumo(Mahjong.Utils.nextHouse(log.house), log.tsumoTile);
					triggerRef(engine);
				}, 1000);

				myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
				opTurnTimerRmain.value = room.value.timeLimitForEachTurn;
				break;
			}

			default:
				break;
		}
	}
}

function restoreRoom(_room) {
	room.value = deepClone(_room);

	engine.value = new Mahjong.Engine.PlayerGameEngine(myUserNumber, room.value.gameState);
}

onMounted(() => {
	if (props.connection != null) {
		props.connection.on('log', onStreamLog);
	}
});

onActivated(() => {
	if (props.connection != null) {
		props.connection.on('log', onStreamLog);
	}
});

onDeactivated(() => {
	if (props.connection != null) {
		props.connection.off('log', onStreamLog);
	}
});

onUnmounted(() => {
	if (props.connection != null) {
		props.connection.off('log', onStreamLog);
	}
});
</script>

<style lang="scss" module>
</style>
