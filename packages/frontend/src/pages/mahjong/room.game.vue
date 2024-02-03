<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.taku">
		<div :class="$style.centerPanel">
			<div style="text-align: center;">
				<div :class="$style.centerPanelTickerToi">
					<div style="position: absolute; left: 10px; bottom: 5px;">
						<span :class="$style.centerPanelHouse">{{ Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse)) === 'e' ? i18n.ts._mahjong.east : Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse)) === 's' ? i18n.ts._mahjong.south : Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse)) === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</span>
						<span :class="$style.centerPanelPoint">{{ engine.state.points[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))] }}</span>
					</div>
				</div>
				<div :class="$style.centerPanelTickerKami">
					<div style="position: absolute; left: 10px; bottom: 5px;">
						<span :class="$style.centerPanelHouse">{{ Mahjong.prevHouse(engine.myHouse) === 'e' ? i18n.ts._mahjong.east : Mahjong.prevHouse(engine.myHouse) === 's' ? i18n.ts._mahjong.south : Mahjong.prevHouse(engine.myHouse) === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</span>
						<span :class="$style.centerPanelPoint">{{ engine.state.points[Mahjong.prevHouse(engine.myHouse)] }}</span>
					</div>
				</div>
				<div :class="$style.centerPanelTickerSimo">
					<div style="position: absolute; left: 10px; bottom: 5px;">
						<span :class="$style.centerPanelHouse">{{ Mahjong.nextHouse(engine.myHouse) === 'e' ? i18n.ts._mahjong.east : Mahjong.nextHouse(engine.myHouse) === 's' ? i18n.ts._mahjong.south : Mahjong.nextHouse(engine.myHouse) === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</span>
						<span :class="$style.centerPanelPoint">{{ engine.state.points[Mahjong.nextHouse(engine.myHouse)] }}</span>
					</div>
				</div>
				<div :class="$style.centerPanelTickerMe">
					<div style="position: absolute; left: 10px; bottom: 5px;">
						<span :class="$style.centerPanelHouse">{{ engine.myHouse === 'e' ? i18n.ts._mahjong.east : engine.myHouse === 's' ? i18n.ts._mahjong.south : engine.myHouse === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</span>
						<span :class="$style.centerPanelPoint">{{ engine.state.points[engine.myHouse] }}</span>
					</div>
				</div>
				<div>
					<div>{{ engine.state.tilesCount }}</div>
				</div>
			</div>
		</div>

		<div :class="$style.handTilesOfToimen">
			<div v-for="tile in engine.state.handTiles[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))]" style="display: inline-block;">
				<img :src="`/client-assets/mahjong/tile-back.png`" :class="$style.handTileImgOfToimen"/>
			</div>
		</div>

		<div :class="$style.handTilesOfKamitya">
			<div v-for="tile in engine.state.handTiles[Mahjong.prevHouse(engine.myHouse)]" :class="$style.sideTile">
				<img :src="`/client-assets/mahjong/tile-side.png`" style="display: inline-block; width: 32px;"/>
			</div>
		</div>

		<div :class="$style.handTilesOfSimotya">
			<div v-for="tile in engine.state.handTiles[Mahjong.nextHouse(engine.myHouse)]" :class="$style.sideTile">
				<img :src="`/client-assets/mahjong/tile-side.png`" style="display: inline-block; width: 32px; scale: -1 1;"/>
			</div>
		</div>

		<div :class="$style.huroTilesOfToimen">
			<XHuro v-for="huro in engine.state.huros[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))]" :huro="huro" :variation="1" :doras="engine.doras"/>
		</div>

		<div :class="$style.huroTilesOfKamitya">
			<XHuro v-for="huro in engine.state.huros[Mahjong.prevHouse(engine.myHouse)]" :huro="huro" :variation="1" :doras="engine.doras"/>
		</div>

		<div :class="$style.huroTilesOfSimotya">
			<XHuro v-for="huro in engine.state.huros[Mahjong.nextHouse(engine.myHouse)]" :huro="huro" :variation="1" :doras="engine.doras"/>
		</div>

		<div :class="$style.huroTilesOfMe">
			<XHuro v-for="huro in engine.state.huros[engine.myHouse]" :huro="huro" :variation="1" :doras="engine.doras"/>
		</div>

		<div :class="$style.hoTilesContainer">
			<div :class="$style.hoTilesContainerOfToimen">
				<div :class="$style.hoTilesOfToimen">
					<div v-for="(tile, i) in engine.state.hoTiles[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))]" :class="$style.hoTile" :style="{ zIndex: engine.state.hoTiles[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))].length - i }">
						<XTile :tile="tile" variation="2" :doras="engine.doras"/>
					</div>
				</div>
			</div>
			<div :class="$style.hoTilesContainerOfKamitya">
				<div :class="$style.hoTilesOfKamitya">
					<div v-for="tile in engine.state.hoTiles[Mahjong.prevHouse(engine.myHouse)]" :class="$style.hoTile">
						<XTile :tile="tile" variation="4" :doras="engine.doras"/>
					</div>
				</div>
			</div>
			<div :class="$style.hoTilesContainerOfSimotya">
				<div :class="$style.hoTilesOfSimotya">
					<div v-for="(tile, i) in engine.state.hoTiles[Mahjong.nextHouse(engine.myHouse)]" :class="$style.hoTile" :style="{ zIndex: engine.state.hoTiles[Mahjong.nextHouse(engine.myHouse)].length - i }">
						<XTile :tile="tile" variation="5" :doras="engine.doras"/>
					</div>
				</div>
			</div>
			<div :class="$style.hoTilesContainerOfMe">
				<div :class="$style.hoTilesOfMe">
					<div v-for="tile in engine.state.hoTiles[engine.myHouse]" :class="$style.hoTile">
						<XTile :tile="tile" variation="1" :doras="engine.doras"/>
					</div>
				</div>
			</div>
		</div>

		<div :class="$style.handTilesOfMe">
			<div
				v-for="tile in Mahjong.sortTiles((isMyTurn && iTsumoed) ? engine.myHandTiles.slice(0, engine.myHandTiles.length - 1) : engine.myHandTiles)"
				:class="[$style.myTile, { [$style.myTileNonSelectable]: selectableTiles != null && !selectableTiles.includes(tile), [$style.myTileDora]: engine.doras.includes(tile) }]"
				@click="chooseTile(tile, $event)"
			>
				<img :src="`/client-assets/mahjong/tile-front.png`" :class="$style.myTileBg"/>
				<img :src="`/client-assets/mahjong/tiles/${tile}.png`" :class="$style.myTileFg"/>
			</div>
			<div
				v-if="isMyTurn && iTsumoed"
				style="display: inline-block; margin-left: 5px;"
				:class="[$style.myTile, { [$style.myTileNonSelectable]: selectableTiles != null && !selectableTiles.includes(engine.myHandTiles.at(-1)), [$style.myTileDora]: engine.doras.includes(engine.myHandTiles.at(-1)) }]"
				@click="chooseTile(engine.myHandTiles.at(-1), $event)"
			>
				<img :src="`/client-assets/mahjong/tile-front.png`" :class="$style.myTileBg"/>
				<img :src="`/client-assets/mahjong/tiles/${engine.myHandTiles.at(-1)}.png`" :class="$style.myTileFg"/>
			</div>
		</div>

		<div :class="$style.serifContainer">
			<div :class="$style.serifContainerOfToimen">
				<Transition
					:enterActiveClass="$style.transition_serif_enterActive"
					:leaveActiveClass="$style.transition_serif_leaveActive"
					:enterFromClass="$style.transition_serif_enterFrom"
					:leaveToClass="$style.transition_serif_leaveTo"
				>
					<img v-if="ronSerifHouses[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))]" :src="`/client-assets/mahjong/ron.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ciiSerifHouses[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))]" :src="`/client-assets/mahjong/cii.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ponSerifHouses[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))]" :src="`/client-assets/mahjong/pon.png`" style="display: block; width: 100%;"/>
					<img v-else-if="kanSerifHouses[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))]" :src="`/client-assets/mahjong/kan.png`" style="display: block; width: 100%;"/>
					<img v-else-if="tsumoSerifHouses[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))]" :src="`/client-assets/mahjong/tsumo.png`" style="display: block; width: 100%;"/>
					<img v-else-if="riichiSerifHouses[Mahjong.prevHouse(Mahjong.prevHouse(engine.myHouse))]" :src="`/client-assets/mahjong/riichi.png`" style="display: block; width: 100%;"/>
				</Transition>
			</div>
			<div :class="$style.serifContainerOfKamitya">
				<Transition
					:enterActiveClass="$style.transition_serif_enterActive"
					:leaveActiveClass="$style.transition_serif_leaveActive"
					:enterFromClass="$style.transition_serif_enterFrom"
					:leaveToClass="$style.transition_serif_leaveTo"
				>
					<img v-if="ronSerifHouses[Mahjong.prevHouse(engine.myHouse)]" :src="`/client-assets/mahjong/ron.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ciiSerifHouses[Mahjong.prevHouse(engine.myHouse)]" :src="`/client-assets/mahjong/cii.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ponSerifHouses[Mahjong.prevHouse(engine.myHouse)]" :src="`/client-assets/mahjong/pon.png`" style="display: block; width: 100%;"/>
					<img v-else-if="kanSerifHouses[Mahjong.prevHouse(engine.myHouse)]" :src="`/client-assets/mahjong/kan.png`" style="display: block; width: 100%;"/>
					<img v-else-if="tsumoSerifHouses[Mahjong.prevHouse(engine.myHouse)]" :src="`/client-assets/mahjong/tsumo.png`" style="display: block; width: 100%;"/>
					<img v-else-if="riichiSerifHouses[Mahjong.prevHouse(engine.myHouse)]" :src="`/client-assets/mahjong/riichi.png`" style="display: block; width: 100%;"/>
				</Transition>
			</div>
			<div :class="$style.serifContainerOfSimotya">
				<Transition
					:enterActiveClass="$style.transition_serif_enterActive"
					:leaveActiveClass="$style.transition_serif_leaveActive"
					:enterFromClass="$style.transition_serif_enterFrom"
					:leaveToClass="$style.transition_serif_leaveTo"
				>
					<img v-if="ronSerifHouses[Mahjong.nextHouse(engine.myHouse)]" :src="`/client-assets/mahjong/ron.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ciiSerifHouses[Mahjong.nextHouse(engine.myHouse)]" :src="`/client-assets/mahjong/cii.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ponSerifHouses[Mahjong.nextHouse(engine.myHouse)]" :src="`/client-assets/mahjong/pon.png`" style="display: block; width: 100%;"/>
					<img v-else-if="kanSerifHouses[Mahjong.nextHouse(engine.myHouse)]" :src="`/client-assets/mahjong/kan.png`" style="display: block; width: 100%;"/>
					<img v-else-if="tsumoSerifHouses[Mahjong.nextHouse(engine.myHouse)]" :src="`/client-assets/mahjong/tsumo.png`" style="display: block; width: 100%;"/>
					<img v-else-if="riichiSerifHouses[Mahjong.nextHouse(engine.myHouse)]" :src="`/client-assets/mahjong/riichi.png`" style="display: block; width: 100%;"/>
				</Transition>
			</div>
			<div :class="$style.serifContainerOfMe">
				<Transition
					:enterActiveClass="$style.transition_serif_enterActive"
					:leaveActiveClass="$style.transition_serif_leaveActive"
					:enterFromClass="$style.transition_serif_enterFrom"
					:leaveToClass="$style.transition_serif_leaveTo"
				>
					<img v-if="ronSerifHouses[engine.myHouse]" :src="`/client-assets/mahjong/ron.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ciiSerifHouses[engine.myHouse]" :src="`/client-assets/mahjong/cii.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ponSerifHouses[engine.myHouse]" :src="`/client-assets/mahjong/pon.png`" style="display: block; width: 100%;"/>
					<img v-else-if="kanSerifHouses[engine.myHouse]" :src="`/client-assets/mahjong/kan.png`" style="display: block; width: 100%;"/>
					<img v-else-if="tsumoSerifHouses[engine.myHouse]" :src="`/client-assets/mahjong/tsumo.png`" style="display: block; width: 100%;"/>
					<img v-else-if="riichiSerifHouses[engine.myHouse]" :src="`/client-assets/mahjong/riichi.png`" style="display: block; width: 100%;"/>
				</Transition>
			</div>
		</div>

		<div :class="$style.actions" class="_buttons">
			<MkButton v-if="engine.state.canRonSource != null" primary gradate @click="ron">Ron</MkButton>
			<MkButton v-if="engine.state.canPonSource != null" primary @click="pon">Pon</MkButton>
			<MkButton v-if="engine.state.canRonSource != null || engine.state.canPonSource != null" @click="skip">Skip</MkButton>
			<MkButton v-if="isMyTurn && canHora" primary gradate @click="tsumoHora">Tsumo</MkButton>
			<MkButton v-if="isMyTurn && engine.canRiichi()" primary @click="riichi">Riichi</MkButton>
		</div>
	</div>
	<div v-if="showKyokuResults" :class="$style.kyokuResult">
		<div v-for="(res, house) in kyokuResults" :key="house">
			<div v-if="res != null">
				<div>{{ house === 'e' ? i18n.ts._mahjong.east : house === 's' ? i18n.ts._mahjong.south : house === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</div>
				<div v-for="yaku in res.yakus">
					<div>{{ i18n.ts._mahjong._yakus[yaku.name] }} {{ yaku.fan }}{{ i18n.ts._mahjong.fan }}</div>
				</div>
				<div>{{ i18n.ts._mahjong.dora }} {{ res.doraCount }}{{ i18n.ts._mahjong.fan }}</div>
				<div>{{ res.pointDeltas.e }} / {{ res.pointDeltas.s }} / {{ res.pointDeltas.w }} / {{ res.pointDeltas.n }}</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import * as Mahjong from 'misskey-mahjong';
import XTile from './tile.vue';
import XHuro from './huro.vue';
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
const engine = shallowRef(new Mahjong.PlayerGameEngine(myUserNumber.value, room.value.gameState));

const isMyTurn = computed(() => {
	return engine.value.state.turn === engine.value.myHouse;
});

const canHora = computed(() => {
	return Mahjong.getHoraSets(engine.value.myHandTiles).length > 0;
});

const selectableTiles = ref<Mahjong.Tile[] | null>(null);
const ronSerifHouses = reactive<Record<Mahjong.House, boolean>>({ e: false, s: false, w: false, n: false });
const ciiSerifHouses = reactive<Record<Mahjong.House, boolean>>({ e: false, s: false, w: false, n: false });
const ponSerifHouses = reactive<Record<Mahjong.House, boolean>>({ e: false, s: false, w: false, n: false });
const kanSerifHouses = reactive<Record<Mahjong.House, boolean>>({ e: false, s: false, w: false, n: false });
const tsumoSerifHouses = reactive<Record<Mahjong.House, boolean>>({ e: false, s: false, w: false, n: false });
const riichiSerifHouses = reactive<Record<Mahjong.House, boolean>>({ e: false, s: false, w: false, n: false });

/*
console.log(Mahjong.getTilesForRiichi([
	'm1',
	'm2',
	'm2',
	'm3',
	'm3',
	'm5',
	'm6',
	'p4',
	'p5',
	'p6',
	's6',
	's7',
	's8',
	'm7',
]));
*/
/*
console.log(Mahjong.getHoraSets([
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

let riichiSelect = false;

function chooseTile(tile: Mahjong.Tile, ev: MouseEvent) {
	if (!isMyTurn.value) return;

	iTsumoed.value = false;

	props.connection!.send('dahai', {
		tile: tile,
		riichi: riichiSelect,
	});

	riichiSelect = false;
	selectableTiles.value = null;
}

function riichi() {
	if (!isMyTurn.value) return;

	riichiSelect = true;
	selectableTiles.value = Mahjong.getTilesForRiichi(engine.value.myHandTiles);
	console.log(Mahjong.getTilesForRiichi(engine.value.myHandTiles));
}

function kakan() {
	if (!isMyTurn.value) return;

	props.connection!.send('kakan', {
	});
}

function tsumoHora() {
	if (!isMyTurn.value) return;

	props.connection!.send('tsumoHora', {
	});
}

function ron() {
	props.connection!.send('ronHora', {
	});
}

function pon() {
	props.connection!.send('pon', {
	});
}

function skip() {
	engine.value.commit_nop(engine.value.myHouse);
	triggerRef(engine);

	props.connection!.send('nop', {});
}

const iTsumoed = ref(false);
const showKyokuResults = ref(false);
const kyokuResults = ref<Record<Mahjong.House, {
	yakus: {
		name: string;
		fan: number;
	}[];
	doraCount: number;
	pointDeltas: Record<Mahjong.House, number>;
} | null>>({
	e: null,
	s: null,
	w: null,
	n: null,
});

function kyokuEnd() {
	showKyokuResults.value = true;
}

function onStreamDahai(log) {
	console.log('onStreamDahai', log);

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

	engine.value.commit_dahai(log.house, log.tile, log.riichi);
	triggerRef(engine);

	riichiSerifHouses[log.house] = log.riichi;
	window.setTimeout(() => {
		riichiSerifHouses[log.house] = false;
	}, 2000);

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

	engine.value.commit_tsumo(log.house, log.tile);
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

	sound.playUrl('/client-assets/mahjong/dahai.mp3', {
		volume: 1,
		playbackRate: 1,
	});

	engine.value.commit_dahai(log.dahaiHouse, log.dahaiTile, log.riichi);
	triggerRef(engine);

	riichiSerifHouses[log.dahaiHouse] = log.riichi;
	window.setTimeout(() => {
		riichiSerifHouses[log.dahaiHouse] = false;
	}, 2000);

	window.setTimeout(() => {
		engine.value.commit_tsumo(Mahjong.nextHouse(log.dahaiHouse), log.tsumoTile);
		triggerRef(engine);

		if (Mahjong.nextHouse(log.dahaiHouse) === engine.value.myHouse) {
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

	engine.value.commit_pon(log.caller, log.callee);
	triggerRef(engine);

	ponSerifHouses[log.caller] = true;
	window.setTimeout(() => {
		ponSerifHouses[log.caller] = false;
	}, 2000);

	myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
}

function onStreamRonned(log) {
	console.log('onStreamRonned', log);

	const res = engine.value.commit_ronHora(log.callers, log.callee, log.handTiles);
	triggerRef(engine);

	kyokuResults.value = res;

	window.setTimeout(() => {
		showKyokuResults.value = true;
	}, 1500);

	for (const caller of log.callers) {
		ronSerifHouses[caller] = true;
	}

	console.log('ronned', res);
}

function onStreamTsumoHora(log) {
	console.log('onStreamTsumoHora', log);

	const res = engine.value.commit_tsumoHora(log.house, log.handTiles, log.tsumoTile);
	triggerRef(engine);

	kyokuResults.value[log.house] = res;

	window.setTimeout(() => {
		showKyokuResults.value = true;
	}, 1500);

	tsumoSerifHouses[log.house] = true;

	console.log('tsumohora', res);
}

function restoreRoom(_room) {
	room.value = deepClone(_room);

	engine.value = new Mahjong.PlayerGameEngine(myUserNumber, room.value.gameState);
}

onMounted(() => {
	if (props.connection != null) {
		props.connection.on('dahai', onStreamDahai);
		props.connection.on('tsumo', onStreamTsumo);
		props.connection.on('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.on('ponned', onStreamPonned);
		props.connection.on('ronned', onStreamRonned);
		props.connection.on('tsumoHora', onStreamTsumoHora);
	}
});

onActivated(() => {
	if (props.connection != null) {
		props.connection.on('dahai', onStreamDahai);
		props.connection.on('tsumo', onStreamTsumo);
		props.connection.on('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.on('ponned', onStreamPonned);
		props.connection.on('ronned', onStreamRonned);
		props.connection.on('tsumoHora', onStreamTsumoHora);
	}
});

onDeactivated(() => {
	if (props.connection != null) {
		props.connection.off('dahai', onStreamDahai);
		props.connection.off('tsumo', onStreamTsumo);
		props.connection.off('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.off('ponned', onStreamPonned);
		props.connection.off('ronned', onStreamRonned);
		props.connection.off('tsumoHora', onStreamTsumoHora);
	}
});

onUnmounted(() => {
	if (props.connection != null) {
		props.connection.off('dahai', onStreamDahai);
		props.connection.off('tsumo', onStreamTsumo);
		props.connection.off('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.off('ponned', onStreamPonned);
		props.connection.off('ronned', onStreamRonned);
		props.connection.off('tsumoHora', onStreamTsumoHora);
	}
});
</script>

<style lang="scss" module>
@keyframes shine {
	0% { translate: -30px; }
	100% { translate: -130px; }
}

.transition_serif_enterActive,
.transition_serif_leaveActive {
	transition: opacity 0.1s linear, scale 0.1s linear;
}
.transition_serif_enterFrom {
	scale: 1.25;
	opacity: 0;
}
.transition_serif_leaveTo {
	opacity: 0;
}

.root {
	background: #3C7A43;
	background-image: url('/client-assets/mahjong/bg.jpg');
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
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

.kyokuResult {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1000;
	width: 100%;
	height: 100%;
	max-width: 800px;
	margin: auto;
	box-sizing: border-box;
	background: #0009;
	color: #fff;
}

.centerPanel {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: grid;
	place-items: center;
	width: 150px;
	height: 150px;
	margin: auto;
	scale: 0.9;
	background: #333;
	border: solid 1px #888;
	border-radius: 10px;
	box-shadow: 0 4px 10px #000a;
}
.centerPanelTickerToi {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	rotate: 180deg;
}
.centerPanelTickerKami {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	rotate: 90deg;
}
.centerPanelTickerSimo {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	rotate: -90deg;
}
.centerPanelTickerMe {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
}
.centerPanelHouse {
	font-weight: bold;
}
.centerPanelPoint {
	margin-left: 10px;
}

.handTilesOfToimen {
	position: absolute;
	top: 0;
	left: 80px;
}
.handTileImgOfToimen {
	display: inline-block;
	vertical-align: bottom;
	width: 32px;
	box-shadow: 0px 8px 2px 0px #0003;
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

.huroTilesOfToimen {
	position: absolute;
	top: 0;
	left: 80px;
}

.huroTilesOfKamitya {
	position: absolute;
	top: 80px;
	left: 0;
}

.huroTilesOfSimotya {
	position: absolute;
	top: 80px;
	right: 0;
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
	bottom: calc(50% + 125px);
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
	right: calc(50% + 125px);
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
	left: calc(50% + 125px);
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
	top: calc(50% + 125px);
	left: 0;
	right: 0;
	margin: auto;
	width: min-content;
}
.hoTilesOfMe {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
}

.serifContainer {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 100;
	pointer-events: none;
}
.serifContainerOfKamitya {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	margin: auto;
	width: 200px;
	height: min-content;
}
.serifContainerOfSimotya {
	position: absolute;
	top: 0;
	bottom: 0;
	right: 0;
	margin: auto;
	width: 200px;
	height: min-content;
}
.serifContainerOfToimen {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	margin: auto;
	width: 200px;
	height: min-content;
}
.serifContainerOfMe {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	margin: auto;
	width: 200px;
	height: min-content;
}

.sideTile {
	margin-bottom: -26px;
}

.hoTile {
	position: relative;
	display: inline-block;
	margin-bottom: -8px;
}

.myTile {
	display: inline-block;
	position: relative;
	width: 35px;
	aspect-ratio: 0.7;
	transition: translate 0.1s ease;
	cursor: pointer;
	overflow: clip;
}
.myTile:hover {
	translate: 0 -10px;
}
.myTileNonSelectable {
	filter: grayscale(1);
	opacity: 0.7;
	pointer-events: none;
}
.myTileDora {
	&:after {
		content: "";
		display: block;
		position: absolute;
		top: 30px;
		width: 200px;
		height: 8px;
		rotate: -45deg;
		translate: -30px;
		background: #ffffffee;
		animation: shine 2s infinite;
		pointer-events: none;
	}
}
.myTileBg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	pointer-events: none;
	user-select: none;
}
.myTileFg {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 70%;
	object-fit: contain;
	pointer-events: none;
	user-select: none;
}

.actions {
	position: absolute;
	bottom: 80px;
	right: 50px;
}
</style>
