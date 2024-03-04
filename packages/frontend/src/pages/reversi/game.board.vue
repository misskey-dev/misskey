<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="500">
	<div :class="$style.root" class="_gaps">
		<div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
			<span>({{ i18n.ts._reversi.black }})</span>
			<MkAvatar style="width: 32px; height: 32px;" :user="blackUser" :showIndicator="true"/>
			<span> vs </span>
			<MkAvatar style="width: 32px; height: 32px;" :user="whiteUser" :showIndicator="true"/>
			<span>({{ i18n.ts._reversi.white }})</span>
		</div>

		<div style="overflow: clip; line-height: 28px;">
			<div v-if="!iAmPlayer && !game.isEnded && turnUser">
				<Mfm :key="'turn:' + turnUser.id" :text="i18n.tsx._reversi.turnOf({ name: turnUser.name ?? turnUser.username })" :plain="true" :customEmojis="turnUser.emojis"/>
				<MkEllipsis/>
			</div>
			<div v-if="(logPos !== game.logs.length) && turnUser">
				<Mfm :key="'past-turn-of:' + turnUser.id" :text="i18n.tsx._reversi.pastTurnOf({ name: turnUser.name ?? turnUser.username })" :plain="true" :customEmojis="turnUser.emojis"/>
			</div>
			<div v-if="iAmPlayer && !game.isEnded && !isMyTurn">{{ i18n.ts._reversi.opponentTurn }}<MkEllipsis/><span style="margin-left: 1em; opacity: 0.7;">({{ i18n.tsx.remainingN({ n: opTurnTimerRmain }) }})</span></div>
			<div v-if="iAmPlayer && !game.isEnded && isMyTurn"><span style="display: inline-block; font-weight: bold; animation: global-tada 1s linear infinite both;">{{ i18n.ts._reversi.myTurn }}</span><span style="margin-left: 1em; opacity: 0.7;">({{ i18n.tsx.remainingN({ n: myTurnTimerRmain }) }})</span></div>
			<div v-if="game.isEnded && logPos == game.logs.length">
				<template v-if="game.winner">
					<Mfm :key="'won'" :text="i18n.tsx._reversi.won({ name: game.winner.name ?? game.winner.username })" :plain="true" :customEmojis="game.winner.emojis"/>
					<span v-if="game.surrenderedUserId != null"> ({{ i18n.ts._reversi.surrendered }})</span>
					<span v-if="game.timeoutUserId != null"> ({{ i18n.ts._reversi.timeout }})</span>
				</template>
				<template v-else>{{ i18n.ts._reversi.drawn }}</template>
			</div>
		</div>

		<div class="_woodenFrame">
			<div :class="$style.boardInner">
				<div v-if="showBoardLabels" :class="$style.labelsX">
					<span v-for="i in game.map[0].length" :key="i" :class="$style.labelsXLabel">{{ String.fromCharCode(64 + i) }}</span>
				</div>
				<div style="display: flex;">
					<div v-if="showBoardLabels" :class="$style.labelsY">
						<div v-for="i in game.map.length" :key="i" :class="$style.labelsYLabel">{{ i }}</div>
					</div>
					<div :class="$style.boardCells" :style="cellsStyle">
						<div
							v-for="(stone, i) in engine.board"
							:key="i"
							v-tooltip="`${String.fromCharCode(65 + engine.posToXy(i)[0])}${engine.posToXy(i)[1] + 1}`"
							:class="[$style.boardCell, {
								[$style.boardCell_empty]: stone == null,
								[$style.boardCell_none]: engine.map[i] === 'null',
								[$style.boardCell_isEnded]: game.isEnded,
								[$style.boardCell_myTurn]: !game.isEnded && isMyTurn,
								[$style.boardCell_can]: turnUser ? engine.canPut(turnUser.id === blackUser.id, i) : null,
								[$style.boardCell_prev]: engine.prevPos === i
							}]"
							@click="putStone(i)"
						>
							<Transition
								:enterActiveClass="$style.transition_flip_enterActive"
								:leaveActiveClass="$style.transition_flip_leaveActive"
								:enterFromClass="$style.transition_flip_enterFrom"
								:leaveToClass="$style.transition_flip_leaveTo"
								mode="default"
							>
								<template v-if="useAvatarAsStone">
									<img v-if="stone === true" :class="$style.boardCellStone" :src="blackUser.avatarUrl ?? undefined"/>
									<img v-else-if="stone === false" :class="$style.boardCellStone" :src="whiteUser.avatarUrl ?? undefined"/>
								</template>
								<template v-else>
									<img v-if="stone === true" :class="$style.boardCellStone" src="/client-assets/reversi/stone_b.png"/>
									<img v-else-if="stone === false" :class="$style.boardCellStone" src="/client-assets/reversi/stone_w.png"/>
								</template>
							</Transition>
						</div>
					</div>
					<div v-if="showBoardLabels" :class="$style.labelsY">
						<div v-for="i in game.map.length" :key="i" :class="$style.labelsYLabel">{{ i }}</div>
					</div>
				</div>
				<div v-if="showBoardLabels" :class="$style.labelsX">
					<span v-for="i in game.map[0].length" :key="i" :class="$style.labelsXLabel">{{ String.fromCharCode(64 + i) }}</span>
				</div>
			</div>
		</div>

		<div v-if="game.isEnded" class="_panel _gaps_s" style="padding: 16px;">
			<div>{{ logPos }} / {{ game.logs.length }}</div>
			<div v-if="!autoplaying" class="_buttonsCenter">
				<MkButton :disabled="logPos === 0" @click="logPos = 0"><i class="ti ti-chevrons-left"></i></MkButton>
				<MkButton :disabled="logPos === 0" @click="logPos--"><i class="ti ti-chevron-left"></i></MkButton>
				<MkButton :disabled="logPos === game.logs.length" @click="logPos++"><i class="ti ti-chevron-right"></i></MkButton>
				<MkButton :disabled="logPos === game.logs.length" @click="logPos = game.logs.length"><i class="ti ti-chevrons-right"></i></MkButton>
			</div>
			<MkButton style="margin: auto;" :disabled="autoplaying" @click="autoplay()"><i class="ti ti-player-play"></i></MkButton>
		</div>

		<div class="_panel" style="padding: 16px;">
			<div>
				<b>{{ i18n.tsx._reversi.turnCount({ count: logPos }) }}</b> {{ i18n.ts._reversi.black }}:{{ engine.blackCount }} {{ i18n.ts._reversi.white }}:{{ engine.whiteCount }} {{ i18n.ts._reversi.total }}:{{ engine.blackCount + engine.whiteCount }}
			</div>
			<div>
				<div style="display: flex; align-items: center;">
					<span style="margin-right: 8px;">({{ i18n.ts._reversi.black }})</span>
					<MkAvatar style="width: 32px; height: 32px; margin-right: 8px;" :user="blackUser" :showIndicator="true"/>
					<MkA :to="userPage(blackUser)"><MkUserName :user="blackUser"/></MkA>
				</div>
				<div> vs </div>
				<div style="display: flex; align-items: center;">
					<span style="margin-right: 8px;">({{ i18n.ts._reversi.white }})</span>
					<MkAvatar style="width: 32px; height: 32px; margin-right: 8px;" :user="whiteUser" :showIndicator="true"/>
					<MkA :to="userPage(whiteUser)"><MkUserName :user="whiteUser"/></MkA>
				</div>
			</div>
			<div>
				<p v-if="game.isLlotheo">{{ i18n.ts._reversi.isLlotheo }}</p>
				<p v-if="game.loopedBoard">{{ i18n.ts._reversi.loopedMap }}</p>
				<p v-if="game.canPutEverywhere">{{ i18n.ts._reversi.canPutEverywhere }}</p>
			</div>
		</div>

		<MkFolder>
			<template #label>{{ i18n.ts.options }}</template>
			<div class="_gaps_s" style="text-align: left;">
				<MkSwitch v-model="showBoardLabels">{{ i18n.ts._reversi.showBoardLabels }}</MkSwitch>
				<MkSwitch v-model="useAvatarAsStone">{{ i18n.ts._reversi.useAvatarAsStone }}</MkSwitch>
			</div>
		</MkFolder>

		<div class="_buttonsCenter">
			<MkButton v-if="!game.isEnded && iAmPlayer" danger @click="surrender">{{ i18n.ts._reversi.surrender }}</MkButton>
			<MkButton @click="share">{{ i18n.ts.share }}</MkButton>
		</div>

		<MkA v-if="game.isEnded" :to="`/reversi`">
			<img src="/client-assets/reversi/logo.png" style="display: block; max-width: 100%; width: 200px; margin: auto;"/>
		</MkA>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import * as Reversi from 'misskey-reversi';
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
	game: Misskey.entities.ReversiGameDetailed;
	connection?: Misskey.ChannelConnection<Misskey.Channels['reversiGame']> | null;
}>();

const showBoardLabels = ref<boolean>(false);
const useAvatarAsStone = ref<boolean>(true);
const autoplaying = ref<boolean>(false);
// eslint-disable-next-line vue/no-setup-props-destructure
const game = ref<Misskey.entities.ReversiGameDetailed & { logs: Reversi.Serializer.SerializedLog[] }>(deepClone(props.game));
const logPos = ref<number>(game.value.logs.length);
const engine = shallowRef<Reversi.Game>(Reversi.Serializer.restoreGame({
	map: game.value.map,
	isLlotheo: game.value.isLlotheo,
	canPutEverywhere: game.value.canPutEverywhere,
	loopedBoard: game.value.loopedBoard,
	logs: game.value.logs,
}));

const iAmPlayer = computed(() => {
	return game.value.user1Id === $i.id || game.value.user2Id === $i.id;
});

const myColor = computed(() => {
	if (!iAmPlayer.value) return null;
	if (game.value.user1Id === $i.id && game.value.black === 1) return true;
	if (game.value.user2Id === $i.id && game.value.black === 2) return true;
	return false;
});

const opColor = computed(() => {
	if (!iAmPlayer.value) return null;
	return !myColor.value;
});

const blackUser = computed(() => {
	return game.value.black === 1 ? game.value.user1 : game.value.user2;
});

const whiteUser = computed(() => {
	return game.value.black === 1 ? game.value.user2 : game.value.user1;
});

const turnUser = computed(() => {
	if (engine.value.turn === true) {
		return game.value.black === 1 ? game.value.user1 : game.value.user2;
	} else if (engine.value.turn === false) {
		return game.value.black === 1 ? game.value.user2 : game.value.user1;
	} else {
		return null;
	}
});

const isMyTurn = computed(() => {
	if (!iAmPlayer.value) return false;
	const u = turnUser.value;
	if (u == null) return false;
	return u.id === $i.id;
});

const cellsStyle = computed(() => {
	return {
		'grid-template-rows': `repeat(${game.value.map.length}, 1fr)`,
		'grid-template-columns': `repeat(${game.value.map[0].length}, 1fr)`,
	};
});

watch(logPos, (v) => {
	if (!game.value.isEnded) return;
	engine.value = Reversi.Serializer.restoreGame({
		map: game.value.map,
		isLlotheo: game.value.isLlotheo,
		canPutEverywhere: game.value.canPutEverywhere,
		loopedBoard: game.value.loopedBoard,
		logs: game.value.logs.slice(0, v),
	});
});

if (game.value.isStarted && !game.value.isEnded) {
	useInterval(() => {
		if (game.value.isEnded) return;
		const crc32 = engine.value.calcCrc32();
		if (_DEV_) console.log('crc32', crc32);
		misskeyApi('reversi/verify', {
			gameId: game.value.id,
			crc32: crc32.toString(),
		}).then((res) => {
			if (res.desynced) {
				if (_DEV_) console.log('resynced');
				restoreGame(res.game!);
			}
		});
	}, 10000, { immediate: false, afterMounted: true });
}

const appliedOps: string[] = [];

function putStone(pos: number) {
	if (game.value.isEnded) return;
	if (!iAmPlayer.value) return;
	if (!isMyTurn.value) return;
	if (!engine.value.canPut(myColor.value!, pos)) return;

	engine.value.putStone(pos);

	triggerRef(engine);

	sound.playUrl('/client-assets/reversi/put.mp3', {
		volume: 1,
		playbackRate: 1,
	});

	const id = Math.random().toString(36).slice(2);
	props.connection!.send('putStone', {
		pos: pos,
		id,
	});
	appliedOps.push(id);

	myTurnTimerRmain.value = game.value.timeLimitForEachTurn;
	opTurnTimerRmain.value = game.value.timeLimitForEachTurn;

	checkEnd();
}

const myTurnTimerRmain = ref<number>(game.value.timeLimitForEachTurn);
const opTurnTimerRmain = ref<number>(game.value.timeLimitForEachTurn);

const TIMER_INTERVAL_SEC = 3;
if (!props.game.isEnded) {
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

async function onStreamLog(log) {
	game.value.logs = Reversi.Serializer.serializeLogs([
		...Reversi.Serializer.deserializeLogs(game.value.logs),
		log,
	]);

	logPos.value++;

	if (log.id == null || !appliedOps.includes(log.id)) {
		switch (log.operation) {
			case 'put': {
				sound.playUrl('/client-assets/reversi/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				if (log.player !== engine.value.turn) { // = desyncが発生している
					const _game = await misskeyApi('reversi/show-game', {
						gameId: props.game.id,
					});
					restoreGame(_game);
					return;
				}

				engine.value.putStone(log.pos);
				triggerRef(engine);

				myTurnTimerRmain.value = game.value.timeLimitForEachTurn;
				opTurnTimerRmain.value = game.value.timeLimitForEachTurn;

				checkEnd();
				break;
			}

			default:
				break;
		}
	}
}

function onStreamEnded(x) {
	game.value = deepClone(x.game);

	if (game.value.winnerId === $i.id) {
		confetti({
			duration: 1000 * 3,
		});

		sound.playUrl('/client-assets/reversi/win.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	} else {
		sound.playUrl('/client-assets/reversi/lose.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}
}

function checkEnd() {
	game.value.isEnded = engine.value.isEnded;
	if (game.value.isEnded) {
		if (engine.value.winner === true) {
			game.value.winnerId = game.value.black === 1 ? game.value.user1Id : game.value.user2Id;
			game.value.winner = game.value.black === 1 ? game.value.user1 : game.value.user2;
		} else if (engine.value.winner === false) {
			game.value.winnerId = game.value.black === 1 ? game.value.user2Id : game.value.user1Id;
			game.value.winner = game.value.black === 1 ? game.value.user2 : game.value.user1;
		} else {
			game.value.winnerId = null;
			game.value.winner = null;
		}
	}
}

function restoreGame(_game) {
	game.value = deepClone(_game);

	engine.value = Reversi.Serializer.restoreGame({
		map: game.value.map,
		isLlotheo: game.value.isLlotheo,
		canPutEverywhere: game.value.canPutEverywhere,
		loopedBoard: game.value.loopedBoard,
		logs: game.value.logs,
	});

	logPos.value = game.value.logs.length;

	checkEnd();
}

async function surrender() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.areYouSure,
	});
	if (canceled) return;

	misskeyApi('reversi/surrender', {
		gameId: game.value.id,
	});
}

function autoplay() {
	autoplaying.value = true;
	logPos.value = 0;
	const logs = Reversi.Serializer.deserializeLogs(game.value.logs);

	window.setTimeout(() => {
		logPos.value = 1;

		let i = 1;
		let previousLog = logs[0];
		const tick = () => {
			const log = logs[i];
			const time = log.time - previousLog.time;
			setTimeout(() => {
				i++;
				logPos.value++;
				previousLog = log;

				if (i < logs.length) {
					tick();
				} else {
					autoplaying.value = false;
				}
			}, time);
		};

		tick();
	}, 1000);
}

function share() {
	os.post({
		initialText: `#MisskeyReversi ${location.href}`,
		instant: true,
	});
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
