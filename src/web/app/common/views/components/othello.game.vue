<template>
<div class="root">
	<header><b>{{ blackUser.name }}</b>(黒) vs <b>{{ whiteUser.name }}</b>(白)</header>

	<p class="turn" v-if="!iAmPlayer && !game.is_ended">{{ turnUser.name }}のターンです<mk-ellipsis/></p>
	<p class="turn" v-if="logPos != logs.length">{{ turnUser.name }}のターン</p>
	<p class="turn" v-if="iAmPlayer && !game.is_ended">{{ isMyTurn ? 'あなたのターンです' : '相手のターンです' }}<mk-ellipsis v-if="!isMyTurn"/></p>
	<p class="result" v-if="game.is_ended && logPos == logs.length">
		<template v-if="game.winner"><b>{{ game.winner.name }}</b>の勝ち{{ game.settings.is_llotheo ? ' (ロセオ)' : '' }}</template>
		<template v-else>引き分け</template>
	</p>

	<div class="board" :style="{ 'grid-template-rows': `repeat(${ game.settings.map.size }, 1fr)`, 'grid-template-columns': `repeat(${ game.settings.map.size }, 1fr)` }">
		<div v-for="(stone, i) in o.board"
			:class="{ empty: stone == null, none: o.map.data[i] == ' ', myTurn: !game.is_ended && isMyTurn, can: turnUser ? o.canPut(turnUser.id == blackUser.id ? 'black' : 'white', i) : null, prev: o.prevPos == i }"
			@click="set(i)"
		>
			<img v-if="stone == 'black'" :src="`${blackUser.avatar_url}?thumbnail&size=128`" alt="">
			<img v-if="stone == 'white'" :src="`${whiteUser.avatar_url}?thumbnail&size=128`" alt="">
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

	<div class="player" v-if="game.is_ended">
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
import Othello, { Color } from '../../../../../common/othello/core';

export default Vue.extend({
	props: ['game', 'connection'],

	data() {
		return {
			o: null as Othello,
			logs: [],
			logPos: 0
		};
	},

	computed: {
		iAmPlayer(): boolean {
			return this.game.user1_id == (this as any).os.i.id || this.game.user2_id == (this as any).os.i.id;
		},
		myColor(): Color {
			if (!this.iAmPlayer) return null;
			if (this.game.user1_id == (this as any).os.i.id && this.game.black == 1) return 'black';
			if (this.game.user2_id == (this as any).os.i.id && this.game.black == 2) return 'black';
			return 'white';
		},
		opColor(): Color {
			if (!this.iAmPlayer) return null;
			return this.myColor == 'black' ? 'white' : 'black';
		},
		blackUser(): any {
			return this.game.black == 1 ? this.game.user1 : this.game.user2;
		},
		whiteUser(): any {
			return this.game.black == 1 ? this.game.user2 : this.game.user1;
		},
		turnUser(): any {
			if (this.o.turn == 'black') {
				return this.game.black == 1 ? this.game.user1 : this.game.user2;
			} else if (this.o.turn == 'white') {
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
			if (!this.game.is_ended) return;
			this.o = new Othello(this.game.settings.map, {
				isLlotheo: this.game.settings.is_llotheo
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
		this.o = new Othello(this.game.settings.map, {
			isLlotheo: this.game.settings.is_llotheo
		});

		this.game.logs.forEach(log => {
			this.o.put(log.color, log.pos);
		});

		this.logs = this.game.logs;
		this.logPos = this.logs.length;
	},

	mounted() {
		this.connection.on('set', this.onSet);
	},

	beforeDestroy() {
		this.connection.off('set', this.onSet);
	},

	methods: {
		set(pos) {
			if (this.game.is_ended) return;
			if (!this.iAmPlayer) return;
			if (!this.isMyTurn) return;
			if (!this.o.canPut(this.myColor, pos)) return;

			this.o.put(this.myColor, pos);

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
		},

		checkEnd() {
			this.game.is_ended = this.o.isEnded;
			if (this.game.is_ended) {
				if (this.o.winner == 'black') {
					this.game.winner_id = this.game.black == 1 ? this.game.user1_id : this.game.user2_id;
					this.game.winner = this.game.black == 1 ? this.game.user1 : this.game.user2;
				} else if (this.o.winner == 'white') {
					this.game.winner_id = this.game.black == 1 ? this.game.user2_id : this.game.user1_id;
					this.game.winner = this.game.black == 1 ? this.game.user2 : this.game.user1;
				} else {
					this.game.winner_id = null;
					this.game.winner = null;
				}
			}
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

			&.prev
				box-shadow 0 0 0 4px rgba($theme-color, 0.7)

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

	> .player
		margin-bottom 16px

		> span
			display inline-block
			margin 0 8px
			min-width 70px
</style>
