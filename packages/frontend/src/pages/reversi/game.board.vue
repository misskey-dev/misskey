<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="600">
	<div :class="$style.root" class="_gaps">
		<header><b><MkA :to="userPage(blackUser)"><MkUserName :user="blackUser"/></MkA></b>({{ i18n.ts._reversi.black }}) vs <b><MkA :to="userPage(whiteUser)"><MkUserName :user="whiteUser"/></MkA></b>({{ i18n.ts._reversi.white }})</header>

		<div style="overflow: clip; line-height: 28px;">
			<div v-if="!iAmPlayer && !game.isEnded && turnUser" class="turn">
				<Mfm :key="'turn:' + turnUser.id" :text="i18n.t('_reversi.turnOf', { name: turnUser.name ?? turnUser.username })" :plain="true" :customEmojis="turnUser.emojis"/>
				<MkEllipsis/>
			</div>
			<div v-if="(logPos !== logs.length) && turnUser" class="turn">
				<Mfm :key="'past-turn-of:' + turnUser.id" :text="i18n.t('_reversi.pastTurnOf', { name: turnUser.name ?? turnUser.username })" :plain="true" :customEmojis="turnUser.emojis"/>
			</div>
			<div v-if="iAmPlayer && !game.isEnded && !isMyTurn" class="turn1">{{ i18n.ts._reversi.opponentTurn }}<MkEllipsis/></div>
			<div v-if="iAmPlayer && !game.isEnded && isMyTurn" class="turn2" style="animation: tada 1s linear infinite both;">{{ i18n.ts._reversi.myTurn }}</div>
			<div v-if="game.isEnded && logPos == logs.length" class="result">
				<template v-if="game.winner">
					<Mfm :key="'won'" :text="i18n.t('_reversi.won', { name: game.winner.name ?? game.winner.username })" :plain="true" :customEmojis="game.winner.emojis"/>
					<span v-if="game.surrendered != null"> ({{ i18n.ts._reversi.surrendered }})</span>
				</template>
				<template v-else>{{ i18n.ts._reversi.drawn }}</template>
			</div>
		</div>

		<div :class="$style.board">
			<div v-if="showBoardLabels" :class="$style.labelsX">
				<span v-for="i in game.map[0].length" :class="$style.labelsXLabel">{{ String.fromCharCode(64 + i) }}</span>
			</div>
			<div style="display: flex;">
				<div v-if="showBoardLabels" :class="$style.labelsY">
					<div v-for="i in game.map.length" :class="$style.labelsYLabel">{{ i }}</div>
				</div>
				<div :class="$style.boardCells" :style="cellsStyle">
					<div
						v-for="(stone, i) in engine.board"
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
						<img v-if="stone === true" style="pointer-events: none; user-select: none; display: block; width: 100%; height: 100%;" :src="blackUser.avatarUrl">
						<img v-if="stone === false" style="pointer-events: none; user-select: none; display: block; width: 100%; height: 100%;" :src="whiteUser.avatarUrl">
					</div>
				</div>
				<div v-if="showBoardLabels" :class="$style.labelsY">
					<div v-for="i in game.map.length" :class="$style.labelsYLabel">{{ i }}</div>
				</div>
			</div>
			<div v-if="showBoardLabels" :class="$style.labelsX">
				<span v-for="i in game.map[0].length" :class="$style.labelsXLabel">{{ String.fromCharCode(64 + i) }}</span>
			</div>
		</div>

		<div class="status"><b>{{ i18n.t('_reversi.turnCount', { count: logPos }) }}</b> {{ i18n.ts._reversi.black }}:{{ engine.blackCount }} {{ i18n.ts._reversi.white }}:{{ engine.whiteCount }} {{ i18n.ts._reversi.total }}:{{ engine.blackCount + engine.whiteCount }}</div>

		<div v-if="!game.isEnded && iAmPlayer" class="_buttonsCenter">
			<MkButton danger @click="surrender">{{ i18n.ts._reversi.surrender }}</MkButton>
		</div>

		<div v-if="game.isEnded" class="_panel _gaps_s" style="padding: 16px;">
			<div>{{ logPos }} / {{ logs.length }}</div>
			<div v-if="!autoplaying" class="_buttonsCenter">
				<MkButton :disabled="logPos === 0" @click="logPos = 0"><i class="ti ti-chevrons-left"></i></MkButton>
				<MkButton :disabled="logPos === 0" @click="logPos--"><i class="ti ti-chevron-left"></i></MkButton>
				<MkButton :disabled="logPos === logs.length" @click="logPos++"><i class="ti ti-chevron-right"></i></MkButton>
				<MkButton :disabled="logPos === logs.length" @click="logPos = logs.length"><i class="ti ti-chevrons-right"></i></MkButton>
			</div>
			<MkButton style="margin: auto;" :disabled="autoplaying" @click="autoplay()"><i class="ti ti-player-play"></i></MkButton>
		</div>

		<div>
			<p v-if="game.isLlotheo">{{ i18n.ts._reversi.isLlotheo }}</p>
			<p v-if="game.loopedBoard">{{ i18n.ts._reversi.loopedMap }}</p>
			<p v-if="game.canPutEverywhere">{{ i18n.ts._reversi.canPutEverywhere }}</p>
		</div>

		<MkA v-if="game.isEnded" :to="`/reversi`">
			<img src="/client-assets/reversi/logo.png" style="display: block; max-width: 100%; width: 200px; margin: auto;"/>
		</MkA>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue';
import * as CRC32 from 'crc-32';
import * as Misskey from 'misskey-js';
import * as Reversi from 'misskey-reversi';
import MkButton from '@/components/MkButton.vue';
import { deepClone } from '@/scripts/clone.js';
import { useInterval } from '@/scripts/use-interval.js';
import { signinRequired } from '@/account.js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { userPage } from '@/filters/user.js';

const $i = signinRequired();

const props = defineProps<{
	game: Misskey.entities.ReversiGameDetailed;
	connection: Misskey.ChannelConnection;
}>();

const showBoardLabels = true;
const autoplaying = ref<boolean>(false);
const game = ref<Misskey.entities.ReversiGameDetailed>(deepClone(props.game));
const logs = ref<Misskey.entities.ReversiLog[]>(game.value.logs);
const logPos = ref<number>(logs.value.length);
const engine = shallowRef<Reversi.Game>(new Reversi.Game(game.value.map, {
	isLlotheo: game.value.isLlotheo,
	canPutEverywhere: game.value.canPutEverywhere,
	loopedBoard: game.value.loopedBoard,
}));

for (const log of game.value.logs) {
	engine.value.put(log.color, log.pos);
}

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
	const _o = new Reversi.Game(game.value.map, {
		isLlotheo: game.value.isLlotheo,
		canPutEverywhere: game.value.canPutEverywhere,
		loopedBoard: game.value.loopedBoard,
	});
	for (const log of logs.value.slice(0, v)) {
		_o.put(log.color, log.pos);
	}
	engine.value = _o;
});

if (game.value.isStarted && !game.value.isEnded) {
	useInterval(() => {
		if (game.value.isEnded) return;
		const crc32 = CRC32.str(logs.value.map(x => x.pos.toString()).join(''));
		props.connection.send('syncState', {
			crc32: crc32,
		});
	}, 5000, { immediate: false, afterMounted: true });
}

function putStone(pos) {
	if (game.value.isEnded) return;
	if (!iAmPlayer.value) return;
	if (!isMyTurn.value) return;
	if (!engine.value.canPut(myColor.value!, pos)) return;

	engine.value.put(myColor.value!, pos);
	triggerRef(engine);

	// サウンドを再生する
	//sound.play(myColor.value ? 'reversiPutBlack' : 'reversiPutWhite');

	props.connection.send('putStone', {
		pos: pos,
	});

	checkEnd();
}

function onPutStone(x) {
	logs.value.push(x);
	logPos.value++;
	engine.value.put(x.color, x.pos);
	triggerRef(engine);
	checkEnd();

	// サウンドを再生する
	if (x.color !== myColor.value) {
		//sound.play(x.color ? 'reversiPutBlack' : 'reversiPutWhite');
	}
}

function onEnded(x) {
	game.value = deepClone(x.game);
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

function onRescue(_game) {
	game.value = deepClone(_game);

	engine.value = new Reversi.Game(game.value.map, {
		isLlotheo: game.value.isLlotheo,
		canPutEverywhere: game.value.canPutEverywhere,
		loopedBoard: game.value.loopedBoard,
	});

	for (const log of game.value.logs) {
		engine.value.put(log.color, log.pos);
	}

	triggerRef(engine);

	logs.value = game.value.logs;
	logPos.value = logs.value.length;

	checkEnd();
}

function surrender() {
	misskeyApi('reversi/surrender', {
		gameId: game.value.id,
	});
}

function autoplay() {
	autoplaying.value = true;
	logPos.value = 0;

	window.setTimeout(() => {
		logPos.value = 1;

		let i = 1;
		let previousLog = game.value.logs[0];
		const tick = () => {
			const log = game.value.logs[i];
			const time = new Date(log.at).getTime() - new Date(previousLog.at).getTime();
			setTimeout(() => {
				i++;
				logPos.value++;
				previousLog = log;

				if (i < game.value.logs.length) {
					tick();
				} else {
					autoplaying.value = false;
				}
			}, time);
		};

		tick();
	}, 1000);
}

onMounted(() => {
	props.connection.on('putStone', onPutStone);
	props.connection.on('rescue', onRescue);
	props.connection.on('ended', onEnded);
});

onUnmounted(() => {
	props.connection.off('putStone', onPutStone);
	props.connection.off('rescue', onRescue);
	props.connection.off('ended', onEnded);
});
</script>

<style lang="scss" module>
@use "sass:math";

$label-size: 16px;
$gap: 4px;

.root {
	text-align: center;
}

.board {
	width: calc(100% - 16px);
	max-width: 500px;
	margin: 0 auto;
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
	border-radius: 6px;
	overflow: clip;

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
</style>
