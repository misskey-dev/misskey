<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="500">
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
	room: Misskey.entities.ReversiRoomDetailed;
	connection?: Misskey.ChannelConnection | null;
}>();

const room = ref<Misskey.entities.ReversiRoomDetailed>(deepClone(props.room));
const myUserNumber = computed(() => room.value.user1Id === $i.id ? 1 : room.value.user2Id === $i.id ? 2 : room.value.user3Id === $i.id ? 3 : 4);
const engine = shallowRef(new Mahjong.Engine.PlayerGameEngine(myUserNumber, room.value.gameState));

const isMyTurn = computed(() => {
	return engine.value.state.turn === engine.value.myHouse;
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

async function onStreamLog(log) {
	if (log.id == null || !appliedOps.includes(log.id)) {
		switch (log.operation) {
			case 'put': {
				sound.playUrl('/client-assets/mahjong/dahai.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				if (log.house !== engine.value.turn) { // = desyncが発生している
					const _room = await misskeyApi('reversi/show-room', {
						roomId: props.room.id,
					});
					restoreRoom(_room);
					return;
				}

				engine.value.op_dahai(log.house, log.tile);
				triggerRef(engine);

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
		props.connection.on('ended', onStreamEnded);
	}
});

onActivated(() => {
	if (props.connection != null) {
		props.connection.on('log', onStreamLog);
		props.connection.on('ended', onStreamEnded);
	}
});

onDeactivated(() => {
	if (props.connection != null) {
		props.connection.off('log', onStreamLog);
		props.connection.off('ended', onStreamEnded);
	}
});

onUnmounted(() => {
	if (props.connection != null) {
		props.connection.off('log', onStreamLog);
		props.connection.off('ended', onStreamEnded);
	}
});
</script>

<style lang="scss" module>
@use "sass:math";

.transition_flip_enterActive,
.transition_flip_leaveActive {
	backface-visibility: hidden;
	transition: opacity 0.5s ease, transform 0.5s ease;
}
.transition_flip_enterFrom {
	transform: rotateY(-180deg);
	opacity: 0;
}
.transition_flip_leaveTo {
	transform: rotateY(180deg);
	opacity: 0;
}

$label-size: 16px;
$gap: 4px;

.root {
	text-align: center;
}

.board {
	width: 100%;
	box-sizing: border-box;
	margin: 0 auto;

	padding: 7px;
	background: #8C4F26;
	box-shadow: 0 6px 16px #0007, 0 0 1px 1px #693410, inset 0 0 2px 1px #ce8a5c;
	border-radius: 12px;
}

.boardInner {
	padding: 32px;

	background: var(--panel);
	box-shadow: 0 0 2px 1px #ce8a5c, inset 0 0 1px 1px #693410;
	border-radius: 8px;
}

@container (max-width: 400px) {
	.boardInner {
		padding: 16px;
	}
}

.labelsX {
	height: $label-size;
	padding: 0 $label-size;
	display: flex;
}

.labelsXLabel {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.8em;

	&:first-child {
		margin-left: -(math.div($gap, 2));
	}

	&:last-child {
		margin-right: -(math.div($gap, 2));
	}
}

.labelsY {
	width: $label-size;
	display: flex;
	flex-direction: column;
}

.labelsYLabel {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;

	&:first-child {
		margin-top: -(math.div($gap, 2));
	}

	&:last-child {
		margin-bottom: -(math.div($gap, 2));
	}
}

.boardCells {
	flex: 1;
	display: grid;
	grid-gap: $gap;
}

.boardCell {
	background: transparent;
	border-radius: 100%;
	aspect-ratio: 1;
	transform-style: preserve-3d;
	perspective: 150px;
	transition: border 0.25s ease, opacity 0.25s ease;

	&.boardCell_empty {
		border: solid 2px var(--divider);
	}

	&.boardCell_empty.boardCell_can {
		border-color: var(--accent);
		opacity: 0.5;
	}

	&.boardCell_empty.boardCell_myTurn {
		border-color: var(--divider);
		opacity: 1;

		&.boardCell_can {
			border-color: var(--accent);
			cursor: pointer;

			&:hover {
				background: var(--accent);
			}
		}
	}

	&.boardCell_prev {
		box-shadow: 0 0 0 4px var(--accent);
	}

	&.boardCell_isEnded {
		border-color: var(--divider);
	}

	&.boardCell_none {
		border-color: transparent !important;
	}
}

.boardCellStone {
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: none;
	user-select: none;
	display: block;
	width: 100%;
	height: 100%;
	border-radius: 100%;
}
</style>
