<template>
<div class="xqnhankfuuilcwvhgsopeqncafzsquya">
	<button class="go-index" @click="goIndex"><fa icon="arrow-left"/></button>
	<header><b><router-link :to="blackUser | userPage"><mk-user-name :user="blackUser"/></router-link></b>({{ $t('@.reversi.black') }}) vs <b><router-link :to="whiteUser | userPage"><mk-user-name :user="whiteUser"/></router-link></b>({{ $t('@.reversi.white') }})</header>

	<div style="overflow: hidden; line-height: 28px;">
		<p class="turn" v-if="!iAmPlayer && !game.isEnded">
			<mfm :key="'turn:' + $options.filters.userName(turnUser)" :text="$t('@.reversi.turn-of', { name: $options.filters.userName(turnUser) })" :plain="true" :custom-emojis="turnUser.emojis"/>
			<mk-ellipsis/>
		</p>
		<p class="turn" v-if="logPos != logs.length">
			<mfm :key="'past-turn-of:' + $options.filters.userName(turnUser)" :text="$t('@.reversi.past-turn-of', { name: $options.filters.userName(turnUser) })" :plain="true" :custom-emojis="turnUser.emojis"/>
		</p>
		<p class="turn1" v-if="iAmPlayer && !game.isEnded && !isMyTurn">{{ $t('@.reversi.opponent-turn') }}<mk-ellipsis/></p>
		<p class="turn2" v-if="iAmPlayer && !game.isEnded && isMyTurn" v-animate-css="{ classes: 'tada', iteration: 'infinite' }">{{ $t('@.reversi.my-turn') }}</p>
		<p class="result" v-if="game.isEnded && logPos == logs.length">
			<template v-if="game.winner">
				<mfm :key="'won'" :text="$t('@.reversi.won', { name: $options.filters.userName(game.winner) })" :plain="true" :custom-emojis="game.winner.emojis"/>
				<span v-if="game.surrendered != null"> ({{ $t('surrendered') }})</span>
			</template>
			<template v-else>{{ $t('@.reversi.drawn') }}</template>
		</p>
	</div>

	<div class="board">
		<div class="labels-x" v-if="$store.state.settings.gamesReversiShowBoardLabels">
			<span v-for="i in game.map[0].length">{{ String.fromCharCode(64 + i) }}</span>
		</div>
		<div class="flex">
			<div class="labels-y" v-if="$store.state.settings.gamesReversiShowBoardLabels">
				<div v-for="i in game.map.length">{{ i }}</div>
			</div>
			<div class="cells" :style="cellsStyle">
				<div v-for="(stone, i) in o.board"
					:class="{ empty: stone == null, none: o.map[i] == 'null', isEnded: game.isEnded, myTurn: !game.isEnded && isMyTurn, can: turnUser ? o.canPut(turnUser.id == blackUser.id, i) : null, prev: o.prevPos == i }"
					@click="set(i)"
					:title="`${String.fromCharCode(65 + o.transformPosToXy(i)[0])}${o.transformPosToXy(i)[1] + 1}`"
				>
					<template v-if="$store.state.settings.gamesReversiUseAvatarStones">
						<img v-if="stone === true" :src="blackUser.avatarUrl" alt="black">
						<img v-if="stone === false" :src="whiteUser.avatarUrl" alt="white">
					</template>
					<template v-else>
						<fa v-if="stone === true" :icon="fasCircle"/>
						<fa v-if="stone === false" :icon="farCircle"/>
					</template>
				</div>
			</div>
			<div class="labels-y" v-if="this.$store.state.settings.gamesReversiShowBoardLabels">
				<div v-for="i in game.map.length">{{ i }}</div>
			</div>
		</div>
		<div class="labels-x" v-if="this.$store.state.settings.gamesReversiShowBoardLabels">
			<span v-for="i in game.map[0].length">{{ String.fromCharCode(64 + i) }}</span>
		</div>
	</div>

	<p class="status"><b>{{ $t('@.reversi.this-turn', { count: logPos }) }}</b> {{ $t('@.reversi.black') }}:{{ o.blackCount }} {{ $t('@.reversi.white') }}:{{ o.whiteCount }} {{ $t('@.reversi.total') }}:{{ o.blackCount + o.whiteCount }}</p>

	<div class="actions" v-if="!game.isEnded && iAmPlayer">
		<MkButton @click="surrender">{{ $t('surrender') }}</MkButton>
	</div>

	<div class="player" v-if="game.isEnded">
		<span>{{ logPos }} / {{ logs.length }}</span>
		<ui-horizon-group>
			<ui-button @click="logPos = 0" :disabled="logPos == 0"><fa :icon="faAngleDoubleLeft"/></ui-button>
			<ui-button @click="logPos--" :disabled="logPos == 0"><fa :icon="faAngleLeft"/></ui-button>
			<ui-button @click="logPos++" :disabled="logPos == logs.length"><fa :icon="faAngleRight"/></ui-button>
			<ui-button @click="logPos = logs.length" :disabled="logPos == logs.length"><fa :icon="faAngleDoubleRight"/></ui-button>
		</ui-horizon-group>
	</div>

	<div class="info">
		<p v-if="game.isLlotheo">{{ $t('is-llotheo') }}</p>
		<p v-if="game.loopedBoard">{{ $t('looped-map') }}</p>
		<p v-if="game.canPutEverywhere">{{ $t('can-put-everywhere') }}</p>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faAngleDoubleLeft, faAngleLeft, faAngleRight, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { faCircle as fasCircle } from '@fortawesome/free-solid-svg-icons';
import { faCircle as farCircle } from '@fortawesome/free-regular-svg-icons';
import * as CRC32 from 'crc-32';
import Reversi, { Color } from '../../../games/reversi/core';
import { url } from '@/config';
import MkButton from '@/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton
	},

	props: {
		initGame: {
			type: Object,
			require: true
		},
		connection: {
			type: Object,
			require: true
		},
	},

	data() {
		return {
			game: null,
			o: null as Reversi,
			logs: [],
			logPos: 0,
			pollingClock: null,
			faAngleDoubleLeft, faAngleLeft, faAngleRight, faAngleDoubleRight, fasCircle, farCircle
		};
	},

	computed: {
		iAmPlayer(): boolean {
			if (!this.$store.getters.isSignedIn) return false;
			return this.game.user1Id == this.$store.state.i.id || this.game.user2Id == this.$store.state.i.id;
		},

		myColor(): Color {
			if (!this.iAmPlayer) return null;
			if (this.game.user1Id == this.$store.state.i.id && this.game.black == 1) return true;
			if (this.game.user2Id == this.$store.state.i.id && this.game.black == 2) return true;
			return false;
		},

		opColor(): Color {
			if (!this.iAmPlayer) return null;
			return this.myColor === true ? false : true;
		},

		blackUser(): any {
			return this.game.black == 1 ? this.game.user1 : this.game.user2;
		},

		whiteUser(): any {
			return this.game.black == 1 ? this.game.user2 : this.game.user1;
		},

		turnUser(): any {
			if (this.o.turn === true) {
				return this.game.black == 1 ? this.game.user1 : this.game.user2;
			} else if (this.o.turn === false) {
				return this.game.black == 1 ? this.game.user2 : this.game.user1;
			} else {
				return null;
			}
		},

		isMyTurn(): boolean {
			if (!this.iAmPlayer) return false;
			if (this.turnUser == null) return false;
			return this.turnUser.id == this.$store.state.i.id;
		},

		cellsStyle(): any {
			return {
				'grid-template-rows': `repeat(${this.game.map.length}, 1fr)`,
				'grid-template-columns': `repeat(${this.game.map[0].length}, 1fr)`
			};
		}
	},

	watch: {
		logPos(v) {
			if (!this.game.isEnded) return;
			this.o = new Reversi(this.game.map, {
				isLlotheo: this.game.isLlotheo,
				canPutEverywhere: this.game.canPutEverywhere,
				loopedBoard: this.game.loopedBoard
			});
			for (const log of this.logs.slice(0, v)) {
				this.o.put(log.color, log.pos);
			}
		}
	},

	created() {
		this.game = this.initGame;

		this.o = new Reversi(this.game.map, {
			isLlotheo: this.game.isLlotheo,
			canPutEverywhere: this.game.canPutEverywhere,
			loopedBoard: this.game.loopedBoard
		});

		for (const log of this.game.logs) {
			this.o.put(log.color, log.pos);
		}

		this.logs = this.game.logs;
		this.logPos = this.logs.length;

		// 通信を取りこぼしてもいいように定期的にポーリングさせる
		if (this.game.isStarted && !this.game.isEnded) {
			this.pollingClock = setInterval(() => {
				if (this.game.isEnded) return;
				const crc32 = CRC32.str(this.logs.map(x => x.pos.toString()).join(''));
				this.connection.send('check', {
					crc32: crc32
				});
			}, 3000);
		}
	},

	mounted() {
		this.connection.on('set', this.onSet);
		this.connection.on('rescue', this.onRescue);
		this.connection.on('ended', this.onEnded);
	},

	beforeDestroy() {
		this.connection.off('set', this.onSet);
		this.connection.off('rescue', this.onRescue);
		this.connection.off('ended', this.onEnded);

		clearInterval(this.pollingClock);
	},

	methods: {
		set(pos) {
			if (this.game.isEnded) return;
			if (!this.iAmPlayer) return;
			if (!this.isMyTurn) return;
			if (!this.o.canPut(this.myColor, pos)) return;

			this.o.put(this.myColor, pos);

			// サウンドを再生する
			if (this.$store.state.device.enableSounds) {
				const sound = new Audio(`${url}/assets/reversi-put-me.mp3`);
				sound.volume = this.$store.state.device.soundVolume;
				sound.play();
			}

			this.connection.send('set', {
				pos: pos
			});

			this.checkEnd();
		},

		onSet(x) {
			this.logs.push(x);
			this.logPos++;
			this.o.put(x.color, x.pos);
			this.checkEnd();

			// サウンドを再生する
			if (this.$store.state.device.enableSounds && x.color != this.myColor) {
				const sound = new Audio(`${url}/assets/reversi-put-you.mp3`);
				sound.volume = this.$store.state.device.soundVolume;
				sound.play();
			}
		},

		onEnded(x) {
			this.game = x.game;
		},

		checkEnd() {
			this.game.isEnded = this.o.isEnded;
			if (this.game.isEnded) {
				if (this.o.winner === true) {
					this.game.winnerId = this.game.black == 1 ? this.game.user1Id : this.game.user2Id;
					this.game.winner = this.game.black == 1 ? this.game.user1 : this.game.user2;
				} else if (this.o.winner === false) {
					this.game.winnerId = this.game.black == 1 ? this.game.user2Id : this.game.user1Id;
					this.game.winner = this.game.black == 1 ? this.game.user2 : this.game.user1;
				} else {
					this.game.winnerId = null;
					this.game.winner = null;
				}
			}
		},

		// 正しいゲーム情報が送られてきたとき
		onRescue(game) {
			this.game = game;

			this.o = new Reversi(this.game.map, {
				isLlotheo: this.game.isLlotheo,
				canPutEverywhere: this.game.canPutEverywhere,
				loopedBoard: this.game.loopedBoard
			});

			for (const log of this.game.logs) {
				this.o.put(log.color, log.pos, true);
			}

			this.logs = this.game.logs;
			this.logPos = this.logs.length;

			this.checkEnd();
		},

		surrender() {
			os.api('games/reversi/games/surrender', {
				gameId: this.game.id
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.xqnhankfuuilcwvhgsopeqncafzsquya {
	text-align: center;

	> .go-index {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 1;
		width: 42px;
		height :42px;
	}

	> header {
		padding: 8px;
		border-bottom: dashed 1px var(--divider);
	}

	> .board {
		width: calc(100% - 16px);
		max-width: 500px;
		margin: 0 auto;

		$label-size: 16px;
		$gap: 4px;

		> .labels-x {
			height: $label-size;
			padding: 0 $label-size;
			display: flex;

			> * {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 0.8em;

				&:first-child {
					margin-left: -($gap / 2);
				}

				&:last-child {
					margin-right: -($gap / 2);
				}
			}
		}

		> .flex {
			display: flex;

			> .labels-y {
				width: $label-size;
				display: flex;
				flex-direction: column;

				> * {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 12px;

					&:first-child {
						margin-top: -($gap / 2);
					}

					&:last-child {
						margin-bottom: -($gap / 2);
					}
				}
			}

			> .cells {
				flex: 1;
				display: grid;
				grid-gap: $gap;

				> div {
					background: transparent;
					border-radius: 6px;
					overflow: hidden;

					* {
						pointer-events: none;
						user-select: none;
					}

					&.empty {
						border: solid 2px var(--reversiGameEmptyCell);
					}

					&.empty.can {
						background: var(--reversiGameEmptyCell);
					}

					&.empty.myTurn {
						border-color: var(--reversiGameEmptyCellMyTurn);

						&.can {
							background: var(--reversiGameEmptyCellCanPut);
							cursor: pointer;

							&:hover {
								border-color: var(--primaryDarken10);
								background: var(--primary);
							}

							&:active {
								background: var(--primaryDarken10);
							}
						}
					}

					&.prev {
						box-shadow: 0 0 0 4px var(--primaryAlpha07);
					}

					&.isEnded {
						border-color: var(--reversiGameEmptyCellMyTurn);
					}

					&.none {
						border-color: transparent !important;
					}

					> svg, > img {
						display: block;
						width: 100%;
						height: 100%;
					}
				}
			}
		}
	}

	> .status {
		margin: 0;
		padding: 16px 0;
	}

	> .actions {
		padding-bottom: 16px;
	}

	> .player {
		padding: 0 16px 32px 16px;
		margin: 0 auto;
		max-width: 500px;

		> span {
			display: inline-block;
			margin: 0 8px;
			min-width: 70px;
		}
	}
}
</style>
