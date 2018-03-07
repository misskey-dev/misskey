<template>
<div class="root">
	<header><b>{{ game.black_user.name }}</b>(黒) vs <b>{{ game.white_user.name }}</b>(白)</header>
	<p class="turn" v-if="!iAmPlayer && !isEnded">{{ turn.name }}のターンです<mk-ellipsis/></p>
	<p class="turn" v-if="logPos != logs.length">{{ turn.name }}のターン</p>
	<p class="turn" v-if="iAmPlayer && !isEnded">{{ isMyTurn ? 'あなたのターンです' : '相手のターンです' }}<mk-ellipsis v-if="!isMyTurn"/></p>
	<p class="result" v-if="isEnded && logPos == logs.length">
		<template v-if="winner"><b>{{ winner.name }}</b>の勝ち</template>
		<template v-else>引き分け</template>
	</p>
	<div class="board">
		<div v-for="(stone, i) in o.board"
			:class="{ empty: stone == null, myTurn: isMyTurn, can: o.canReverse(turn.id == game.black_user.id ? 'black' : 'white', i) }"
			@click="set(i)"
		>
			<img v-if="stone == 'black'" :src="`${game.black_user.avatar_url}?thumbnail&size=64`" alt="">
			<img v-if="stone == 'white'" :src="`${game.white_user.avatar_url}?thumbnail&size=64`" alt="">
		</div>
	</div>
	<p>黒:{{ o.blackCount }} 白:{{ o.whiteCount }} 合計:{{ o.blackCount + o.whiteCount }}</p>
	<div class="graph">
		<div v-for="n in 61 - o.stats.length">
		</div>
		<div v-for="data in o.stats">
			<div :style="{ height: `${ Math.floor(data.b * 100) }%` }"></div>
			<div :style="{ height: `${ Math.floor(data.w * 100) }%` }"></div>
		</div>
	</div>
	<div class="player" v-if="isEnded">
		<el-button type="primary" @click="logPos = 0" :disabled="logPos == 0">%fa:fast-backward%</el-button>
		<el-button type="primary" @click="logPos--" :disabled="logPos == 0">%fa:backward%</el-button>
		<span>{{ logPos }} / {{ logs.length }}</span>
		<el-button type="primary" @click="logPos++" :disabled="logPos == logs.length">%fa:forward%</el-button>
		<el-button type="primary" @click="logPos = logs.length" :disabled="logPos == logs.length">%fa:fast-forward%</el-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { OthelloGameStream } from '../../scripts/streaming/othello-game';
import Othello from '../../../../../common/othello';

export default Vue.extend({
	props: ['game'],

	data() {
		return {
			o: new Othello(),
			logs: [],
			logPos: 0,
			turn: null,
			isMyTurn: null,
			isEnded: false,
			winner: null,
			connection: null
		};
	},

	computed: {
		iAmPlayer(): boolean {
			return this.game.black_user_id == (this as any).os.i.id || this.game.white_user_id == (this as any).os.i.id;
		},
		myColor(): string {
			return this.game.black_user_id == (this as any).os.i.id ? 'black' : 'white';
		},
		opColor(): string {
			return this.myColor == 'black' ? 'white' : 'black';
		}
	},

	watch: {
		logPos(v) {
			if (!this.isEnded) return;
			this.o = new Othello();
			this.turn = this.game.black_user;
			this.logs.forEach((log, i) => {
				if (i < v) {
					this.o.set(log.color, log.pos);

					if (log.color == 'black' && this.o.getPattern('white').length > 0) {
						this.turn = this.game.white_user;
					}
					if (log.color == 'black' && this.o.getPattern('white').length == 0) {
						this.turn = this.game.black_user;
					}
					if (log.color == 'white' && this.o.getPattern('black').length > 0) {
						this.turn = this.game.black_user;
					}
					if (log.color == 'white' && this.o.getPattern('black').length == 0) {
						this.turn = this.game.white_user;
					}
				}
			});
			this.$forceUpdate();
		}
	},

	created() {
		this.game.logs.forEach(log => {
			this.o.set(log.color, log.pos);
		});

		this.logs = this.game.logs;
		this.logPos = this.logs.length;
		this.turn = this.game.turn_user_id == this.game.black_user_id ? this.game.black_user : this.game.white_user;
		this.isMyTurn = this.game.turn_user_id == (this as any).os.i.id;
		this.isEnded = this.game.is_ended;
		this.winner = this.game.winner;
	},

	mounted() {
		this.connection = new OthelloGameStream((this as any).os.i, this.game);
		this.connection.on('set', this.onSet);
	},

	beforeDestroy() {
		this.connection.off('set', this.onSet);
		this.connection.close();
	},

	methods: {
		set(pos) {
			if (!this.isMyTurn) return;
			if (!this.o.canReverse(this.myColor, pos)) return;
			this.o.set(this.myColor, pos);
			if (this.o.getPattern(this.opColor).length > 0) {
				this.isMyTurn = !this.isMyTurn;
				this.turn = this.myColor == 'black' ? this.game.white_user : this.game.black_user;
			} else if (this.o.getPattern(this.myColor).length == 0) {
				this.isEnded = true;
				this.winner = this.o.blackCount == this.o.whiteCount ? null : this.o.blackCount > this.o.whiteCount ? this.game.black_user : this.game.white_user;
			}
			this.connection.send({
				type: 'set',
				pos
			});
			this.$forceUpdate();
		},

		onSet(x) {
			this.logs.push(x);
			this.logPos++;
			this.o.set(x.color, x.pos);

			if (this.o.getPattern('black').length == 0 && this.o.getPattern('white').length == 0) {
				this.isEnded = true;
				this.winner = this.o.blackCount == this.o.whiteCount ? null : this.o.blackCount > this.o.whiteCount ? this.game.black_user : this.game.white_user;
			} else {
				if (this.iAmPlayer && this.o.getPattern(this.myColor).length > 0) {
					this.isMyTurn = true;
				}

				if (x.color == 'black' && this.o.getPattern('white').length > 0) {
					this.turn = this.game.white_user;
				}
				if (x.color == 'black' && this.o.getPattern('white').length == 0) {
					this.turn = this.game.black_user;
				}
				if (x.color == 'white' && this.o.getPattern('black').length > 0) {
					this.turn = this.game.black_user;
				}
				if (x.color == 'white' && this.o.getPattern('black').length == 0) {
					this.turn = this.game.white_user;
				}
			}
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
		grid-template-rows repeat(8, 1fr)
		grid-template-columns repeat(8, 1fr)
		grid-gap 4px
		width 300px
		height 300px
		margin 0 auto

		> div
			background transparent
			border-radius 6px
			overflow hidden

			*
				pointer-events none
				user-select none

			&.empty
				border solid 2px #f5f5f5

			&.empty.can
				background #f5f5f5

			&.empty.myTurn
				border-color #eee

				&.can
					background #eee
					cursor pointer

					&:hover
						border-color darken($theme-color, 10%)
						background $theme-color

					&:active
						background darken($theme-color, 10%)

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

	> .player
		margin-bottom 16px

		> span
			display inline-block
			margin 0 8px
			min-width 70px
</style>
