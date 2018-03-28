<template>
<div class="root">
	<header><b>{{ blackUser.name }}</b>(黒) vs <b>{{ whiteUser.name }}</b>(白)</header>

	<div style="overflow: hidden">
		<p class="turn" v-if="!iAmPlayer && !game.isEnded">{{ turnUser.name }}のターンです<mk-ellipsis/></p>
		<p class="turn" v-if="logPos != logs.length">{{ turnUser.name }}のターン</p>
		<p class="turn1" v-if="iAmPlayer && !game.isEnded && !isMyTurn">相手のターンです<mk-ellipsis/></p>
		<p class="turn2" v-if="iAmPlayer && !game.isEnded && isMyTurn" v-animate-css="{ classes: 'tada', iteration: 'infinite' }">あなたのターンです</p>
		<p class="result" v-if="game.isEnded && logPos == logs.length">
			<template v-if="game.winner"><b>{{ game.winner.name }}</b>の勝ち{{ game.settings.isLlotheo ? ' (ロセオ)' : '' }}</template>
			<template v-else>引き分け</template>
		</p>
	</div>

	<div class="board" :style="{ 'grid-template-rows': `repeat(${ game.settings.map.length }, 1fr)`, 'grid-template-columns': `repeat(${ game.settings.map[0].length }, 1fr)` }">
		<div v-for="(stone, i) in o.board"
			:class="{ empty: stone == null, none: o.map[i] == 'null', isEnded: game.isEnded, myTurn: !game.isEnded && isMyTurn, can: turnUser ? o.canPut(turnUser.id == blackUser.id, i) : null, prev: o.prevPos == i }"
			@click="set(i)"
			:title="'[' + (o.transformPosToXy(i)[0] + 1) + ', ' + (o.transformPosToXy(i)[1] + 1) + '] (' + i + ')'"
		>
			<img v-if="stone === true" :src="`${blackUser.avatar_url}?thumbnail&size=128`" alt="">
			<img v-if="stone === false" :src="`${whiteUser.avatar_url}?thumbnail&size=128`" alt="">
		</div>
	</div>

	<p class="status"><b>{{ logPos }}ターン目</b> 黒:{{ o.blackCount }} 白:{{ o.whiteCount }} 合計:{{ o.blackCount + o.whiteCount }}</p>

	<div class="player" v-if="game.isEnded">
		<el-button-group>
			<el-button type="primary" @click="logPos = 0" :disabled="logPos == 0">%fa:angle-double-left%</el-button>
			<el-button type="primary" @click="logPos--" :disabled="logPos == 0">%fa:angle-left%</el-button>
		</el-button-group>
		<span>{{ logPos }} / {{ logs.length }}</span>
		<el-button-group>
			<el-button type="primary" @click="logPos++" :disabled="logPos == logs.length">%fa:angle-right%</el-button>
			<el-button type="primary" @click="logPos = logs.length" :disabled="logPos == logs.length">%fa:angle-double-right%</el-button>
		</el-button-group>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as CRC32 from 'crc-32';
import Othello, { Color } from '../../../../../common/othello/core';
import { url } from '../../../config';

export default Vue.extend({
	props: ['initGame', 'connection'],

	data() {
		return {
			game: null,
			o: null as Othello,
			logs: [],
			logPos: 0,
			pollingClock: null
		};
	},

	computed: {
		iAmPlayer(): boolean {
			if (!(this as any).os.isSignedIn) return false;
			return this.game.user1Id == (this as any).os.i.id || this.game.user2Id == (this as any).os.i.id;
		},
		myColor(): Color {
			if (!this.iAmPlayer) return null;
			if (this.game.user1Id == (this as any).os.i.id && this.game.black == 1) return true;
			if (this.game.user2Id == (this as any).os.i.id && this.game.black == 2) return true;
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
			if (this.turnUser == null) return null;
			return this.turnUser.id == (this as any).os.i.id;
		}
	},

	watch: {
		logPos(v) {
			if (!this.game.isEnded) return;
			this.o = new Othello(this.game.settings.map, {
				isLlotheo: this.game.settings.isLlotheo,
				canPutEverywhere: this.game.settings.canPutEverywhere,
				loopedBoard: this.game.settings.loopedBoard
			});
			this.logs.forEach((log, i) => {
				if (i < v) {
					this.o.put(log.color, log.pos);
				}
			});
			this.$forceUpdate();
		}
	},

	created() {
		this.game = this.initGame;

		this.o = new Othello(this.game.settings.map, {
			isLlotheo: this.game.settings.isLlotheo,
			canPutEverywhere: this.game.settings.canPutEverywhere,
			loopedBoard: this.game.settings.loopedBoard
		});

		this.game.logs.forEach(log => {
			this.o.put(log.color, log.pos);
		});

		this.logs = this.game.logs;
		this.logPos = this.logs.length;

		// 通信を取りこぼしてもいいように定期的にポーリングさせる
		if (this.game.isStarted && !this.game.isEnded) {
			this.pollingClock = setInterval(() => {
				const crc32 = CRC32.str(this.logs.map(x => x.pos.toString()).join(''));
				this.connection.send({
					type: 'check',
					crc32
				});
			}, 3000);
		}
	},

	mounted() {
		this.connection.on('set', this.onSet);
		this.connection.on('rescue', this.onRescue);
	},

	beforeDestroy() {
		this.connection.off('set', this.onSet);
		this.connection.off('rescue', this.onRescue);

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
			if ((this as any).os.isEnableSounds) {
				const sound = new Audio(`${url}/assets/othello-put-me.mp3`);
				sound.volume = localStorage.getItem('soundVolume') ? parseInt(localStorage.getItem('soundVolume'), 10) / 100 : 1;
				sound.play();
			}

			this.connection.send({
				type: 'set',
				pos
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
			if ((this as any).os.isEnableSounds && x.color != this.myColor) {
				const sound = new Audio(`${url}/assets/othello-put-you.mp3`);
				sound.volume = localStorage.getItem('soundVolume') ? parseInt(localStorage.getItem('soundVolume'), 10) / 100 : 1;
				sound.play();
			}
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

			this.o = new Othello(this.game.settings.map, {
				isLlotheo: this.game.settings.isLlotheo,
				canPutEverywhere: this.game.settings.canPutEverywhere,
				loopedBoard: this.game.settings.loopedBoard
			});

			this.game.logs.forEach(log => {
				this.o.put(log.color, log.pos, true);
			});

			this.logs = this.game.logs;
			this.logPos = this.logs.length;

			this.checkEnd();
			this.$forceUpdate();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.root
	text-align center

	> header
		padding 8px
		border-bottom dashed 1px #c4cdd4

	> .board
		display grid
		grid-gap 4px
		width 350px
		height 350px
		margin 0 auto

		> div
			background transparent
			border-radius 6px
			overflow hidden

			*
				pointer-events none
				user-select none

			&.empty
				border solid 2px #eee

			&.empty.can
				background #eee

			&.empty.myTurn
				border-color #ddd

				&.can
					background #eee
					cursor pointer

					&:hover
						border-color darken($theme-color, 10%)
						background $theme-color

					&:active
						background darken($theme-color, 10%)

			&.prev
				box-shadow 0 0 0 4px rgba($theme-color, 0.7)

			&.isEnded
				border-color #ddd

			&.none
				border-color transparent !important

			> img
				display block
				width 100%
				height 100%

	> .graph
		display grid
		grid-template-columns repeat(61, 1fr)
		width 300px
		height 38px
		margin 0 auto 16px auto

		> div
			&:not(:empty)
				background #ccc

			> div:first-child
				background #333

			> div:last-child
				background #ccc

	> .status
		margin 0
		padding 16px 0

	> .player
		padding-bottom 32px

		> span
			display inline-block
			margin 0 8px
			min-width 70px
</style>
