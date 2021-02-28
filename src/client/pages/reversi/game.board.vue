<template>
<div class="xqnhankfuuilcwvhgsopeqncafzsquya">
	<header><b><MkA :to="userPage(blackUser)"><MkUserName :user="blackUser"/></MkA></b>({{ $ts._reversi.black }}) vs <b><MkA :to="userPage(whiteUser)"><MkUserName :user="whiteUser"/></MkA></b>({{ $ts._reversi.white }})</header>

	<div style="overflow: hidden; line-height: 28px;">
		<p class="turn" v-if="!iAmPlayer && !game.isEnded">
			<Mfm :key="'turn:' + turnUser().name" :text="$t('_reversi.turnOf', { name: turnUser().name })" :plain="true" :custom-emojis="turnUser().emojis"/>
			<MkEllipsis/>
		</p>
		<p class="turn" v-if="logPos != logs.length">
			<Mfm :key="'past-turn-of:' + turnUser().name" :text="$t('_reversi.pastTurnOf', { name: turnUser().name })" :plain="true" :custom-emojis="turnUser().emojis"/>
		</p>
		<p class="turn1" v-if="iAmPlayer && !game.isEnded && !isMyTurn()">{{ $ts._reversi.opponentTurn }}<MkEllipsis/></p>
		<p class="turn2" v-if="iAmPlayer && !game.isEnded && isMyTurn()" style="animation: tada 1s linear infinite both;">{{ $ts._reversi.myTurn }}</p>
		<p class="result" v-if="game.isEnded && logPos == logs.length">
			<template v-if="game.winner">
				<Mfm :key="'won'" :text="$t('_reversi.won', { name: game.winner.name })" :plain="true" :custom-emojis="game.winner.emojis"/>
				<span v-if="game.surrendered != null"> ({{ $ts._reversi.surrendered }})</span>
			</template>
			<template v-else>{{ $ts._reversi.drawn }}</template>
		</p>
	</div>

	<div class="board">
		<div class="labels-x" v-if="$store.state.gamesReversiShowBoardLabels">
			<span v-for="i in game.map[0].length">{{ String.fromCharCode(64 + i) }}</span>
		</div>
		<div class="flex">
			<div class="labels-y" v-if="$store.state.gamesReversiShowBoardLabels">
				<div v-for="i in game.map.length">{{ i }}</div>
			</div>
			<div class="cells" :style="cellsStyle">
				<div v-for="(stone, i) in o.board"
					:class="{ empty: stone == null, none: o.map[i] == 'null', isEnded: game.isEnded, myTurn: !game.isEnded && isMyTurn(), can: turnUser() ? o.canPut(turnUser().id == blackUser.id, i) : null, prev: o.prevPos == i }"
					@click="set(i)"
					:title="`${String.fromCharCode(65 + o.transformPosToXy(i)[0])}${o.transformPosToXy(i)[1] + 1}`"
				>
					<template v-if="$store.state.gamesReversiUseAvatarStones || true">
						<img v-if="stone === true" :src="blackUser.avatarUrl" alt="black">
						<img v-if="stone === false" :src="whiteUser.avatarUrl" alt="white">
					</template>
					<template v-else>
						<fa v-if="stone === true" :icon="fasCircle"/>
						<fa v-if="stone === false" :icon="farCircle"/>
					</template>
				</div>
			</div>
			<div class="labels-y" v-if="$store.state.gamesReversiShowBoardLabels">
				<div v-for="i in game.map.length">{{ i }}</div>
			</div>
		</div>
		<div class="labels-x" v-if="$store.state.gamesReversiShowBoardLabels">
			<span v-for="i in game.map[0].length">{{ String.fromCharCode(64 + i) }}</span>
		</div>
	</div>

	<p class="status"><b>{{ $t('_reversi.turnCount', { count: logPos }) }}</b> {{ $ts._reversi.black }}:{{ o.blackCount }} {{ $ts._reversi.white }}:{{ o.whiteCount }} {{ $ts._reversi.total }}:{{ o.blackCount + o.whiteCount }}</p>

	<div class="actions" v-if="!game.isEnded && iAmPlayer">
		<MkButton @click="surrender" inline>{{ $ts._reversi.surrender }}</MkButton>
	</div>

	<div class="player" v-if="game.isEnded">
		<span>{{ logPos }} / {{ logs.length }}</span>
		<div class="buttons" v-if="!autoplaying">
			<MkButton inline @click="logPos = 0" :disabled="logPos == 0"><fa :icon="faAngleDoubleLeft"/></MkButton>
			<MkButton inline @click="logPos--" :disabled="logPos == 0"><fa :icon="faAngleLeft"/></MkButton>
			<MkButton inline @click="logPos++" :disabled="logPos == logs.length"><fa :icon="faAngleRight"/></MkButton>
			<MkButton inline @click="logPos = logs.length" :disabled="logPos == logs.length"><fa :icon="faAngleDoubleRight"/></MkButton>
		</div>
		<MkButton @click="autoplay()" :disabled="autoplaying" style="margin: var(--margin) auto 0 auto;"><fa :icon="faPlay"/></MkButton>
	</div>

	<div class="info">
		<p v-if="game.isLlotheo">{{ $ts._reversi.isLlotheo }}</p>
		<p v-if="game.loopedBoard">{{ $ts._reversi.loopedMap }}</p>
		<p v-if="game.canPutEverywhere">{{ $ts._reversi.canPutEverywhere }}</p>
	</div>

	<div class="watchers">
		<MkAvatar v-for="user in watchers" :key="user.id" :user="user" class="avatar"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faAngleDoubleLeft, faAngleLeft, faAngleRight, faAngleDoubleRight, faPlay } from '@fortawesome/free-solid-svg-icons';
import { faCircle as fasCircle } from '@fortawesome/free-solid-svg-icons';
import { faCircle as farCircle } from '@fortawesome/free-regular-svg-icons';
import * as CRC32 from 'crc-32';
import Reversi, { Color } from '../../../games/reversi/core';
import { url } from '@/config';
import MkButton from '@/components/ui/button.vue';
import { userPage } from '@/filters/user';
import * as os from '@/os';
import * as sound from '@/scripts/sound';

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
			game: JSON.parse(JSON.stringify(this.initGame)),
			o: null as Reversi,
			logs: [],
			logPos: 0,
			watchers: [],
			pollingClock: null,
			faAngleDoubleLeft, faAngleLeft, faAngleRight, faAngleDoubleRight, fasCircle, farCircle, faPlay
		};
	},

	computed: {
		iAmPlayer(): boolean {
			if (!this.$i) return false;
			return this.game.user1Id == this.$i.id || this.game.user2Id == this.$i.id;
		},

		myColor(): Color {
			if (!this.iAmPlayer) return null;
			if (this.game.user1Id == this.$i.id && this.game.black == 1) return true;
			if (this.game.user2Id == this.$i.id && this.game.black == 2) return true;
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
			const o = new Reversi(this.game.map, {
				isLlotheo: this.game.isLlotheo,
				canPutEverywhere: this.game.canPutEverywhere,
				loopedBoard: this.game.loopedBoard
			});
			for (const log of this.logs.slice(0, v)) {
				o.put(log.color, log.pos);
			}
			this.o = o;
			//this.$forceUpdate();
		}
	},

	created() {
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
		this.connection.on('watchers', this.onWatchers);
	},

	beforeUnmount() {
		this.connection.off('set', this.onSet);
		this.connection.off('rescue', this.onRescue);
		this.connection.off('ended', this.onEnded);
		this.connection.off('watchers', this.onWatchers);

		clearInterval(this.pollingClock);
	},

	methods: {
		userPage,

		// this.o がリアクティブになった折にはcomputedにできる
		turnUser(): any {
			if (this.o.turn === true) {
				return this.game.black == 1 ? this.game.user1 : this.game.user2;
			} else if (this.o.turn === false) {
				return this.game.black == 1 ? this.game.user2 : this.game.user1;
			} else {
				return null;
			}
		},

		// this.o がリアクティブになった折にはcomputedにできる
		isMyTurn(): boolean {
			if (!this.iAmPlayer) return false;
			if (this.turnUser() == null) return false;
			return this.turnUser().id == this.$i.id;
		},

		set(pos) {
			if (this.game.isEnded) return;
			if (!this.iAmPlayer) return;
			if (!this.isMyTurn()) return;
			if (!this.o.canPut(this.myColor, pos)) return;

			this.o.put(this.myColor, pos);

			// サウンドを再生する
			sound.play(this.myColor ? 'reversiPutBlack' : 'reversiPutWhite');

			this.connection.send('set', {
				pos: pos
			});

			this.checkEnd();

			this.$forceUpdate();
		},

		onSet(x) {
			this.logs.push(x);
			this.logPos++;
			this.o.put(x.color, x.pos);
			this.checkEnd();
			this.$forceUpdate();

			// サウンドを再生する
			if (x.color !== this.myColor) {
				sound.play(x.color ? 'reversiPutBlack' : 'reversiPutWhite');
			}
		},

		onEnded(x) {
			this.game = JSON.parse(JSON.stringify(x.game));
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
			this.game = JSON.parse(JSON.stringify(game));

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
			this.$forceUpdate();
		},

		onWatchers(users) {
			this.watchers = users;
		},

		surrender() {
			os.api('games/reversi/games/surrender', {
				gameId: this.game.id
			});
		},

		autoplay() {
			this.autoplaying = true;
			this.logPos = 0;

			setTimeout(() => {
				this.logPos = 1;

				let i = 1;
				let previousLog = this.game.logs[0];
				const tick = () => {
					const log = this.game.logs[i];
					const time = new Date(log.at).getTime() - new Date(previousLog.at).getTime()
					setTimeout(() => {
						i++;
						this.logPos++;
						previousLog = log;

						if (i < this.game.logs.length) {
							tick();
						} else {
							this.autoplaying = false;
						}
					}, time);
				};

				tick();
			}, 1000);
		}
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
					overflow: hidden; // overflow: clip; をSafariが対応したら消す
					overflow: clip;

					* {
						pointer-events: none;
						user-select: none;
					}

					&.empty {
						border: solid 2px var(--divider);
					}

					&.empty.can {
						border-color: var(--accent);
					}

					&.empty.myTurn {
						border-color: var(--divider);

						&.can {
							border-color: var(--accent);
							cursor: pointer;

							&:hover {
								background: var(--accent);
							}
						}
					}

					&.prev {
						box-shadow: 0 0 0 4px var(--accent);
					}

					&.isEnded {
						border-color: var(--divider);
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

		> .buttons {
			display: flex;

			> * {
				flex: 1;
			}
		}
	}

	> .watchers {
		padding: 0 0 16px 0;

		&:empty {
			display: none;
		}

		> .avatar {
			width: 32px;
			height: 32px;
		}
	}
}
</style>
