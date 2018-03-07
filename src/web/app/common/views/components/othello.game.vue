<template>
<div class="root">
	<header><b>{{ game.black_user.name }}</b>(黒) vs <b>{{ game.white_user.name }}</b>(白)</header>
	<p class="turn">{{ turn ? 'あなたのターンです' : '相手のターンです' }}<mk-ellipsis v-if="!turn"/></p>
	<div>
		<div v-for="(stone, i) in o.board"
			:class="{ empty: stone == null, myTurn: turn, can: o.canReverse(turn ? myColor : opColor, i) }"
			@click="set(i)"
		>
			<img v-if="stone == 'black'" :src="`${game.black_user.avatar_url}?thumbnail&size=64`" alt="">
			<img v-if="stone == 'white'" :src="`${game.white_user.avatar_url}?thumbnail&size=64`" alt="">
		</div>
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
			turn: null,
			connection: null
		};
	},
	computed: {
		myColor(): string {
			return this.game.black_user_id == (this as any).os.i.id ? 'black' : 'white';
		},
		opColor(): string {
			return this.myColor == 'black' ? 'white' : 'black';
		}
	},
	created() {
		this.game.logs.forEach(log => {
			this.o.set(log.color, log.pos);
		});

		this.turn = this.game.turn_user_id == (this as any).os.i.id;
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
			if (!this.turn) return;
			if (!this.o.canReverse(this.myColor, pos)) return;
			this.o.set(this.myColor, pos);
			if (this.o.getPattern(this.opColor).length > 0) {
				this.turn = !this.turn;
			}
			this.connection.send({
				type: 'set',
				pos
			});
			this.$forceUpdate();
		},
		onSet(x) {
			this.o.set(x.color, x.pos);
			if (this.o.getPattern(this.myColor).length > 0) {
				this.turn = true;
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

	> div
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
</style>
