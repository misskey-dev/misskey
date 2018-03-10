<template>
<div class="mk-othello">
	<div v-if="game">
		<x-gameroom :game="game"/>
	</div>
	<div class="matching" v-else-if="matching">
		<h1><b>{{ matching.name }}</b>を待っています<mk-ellipsis/></h1>
		<div class="cancel">
			<el-button round @click="cancel">キャンセル</el-button>
		</div>
	</div>
	<div class="index" v-else>
		<h1>Misskey %fa:circle%thell%fa:circle R%</h1>
		<p>他のMisskeyユーザーとオセロで対戦しよう</p>
		<div class="play">
			<el-button round>フリーマッチ(準備中)</el-button>
			<el-button type="primary" round @click="match">指名</el-button>
			<details>
				<summary>遊び方</summary>
				<div>
					<p>オセロは、相手と交互に石をボードに置いてゆき、相手の石を挟んでひっくり返しながら、最終的に残った石が多い方が勝ちというボードゲームです。</p>
					<dl>
						<dt><b>フリーマッチ</b></dt>
						<dd>ランダムなユーザーと対戦するモードです。</dd>
						<dt><b>指名</b></dt>
						<dd>指定したユーザーと対戦するモードです。</dd>
					</dl>
				</div>
			</details>
		</div>
		<section v-if="invitations.length > 0">
			<h2>対局の招待があります！:</h2>
			<div class="invitation" v-for="i in invitations" tabindex="-1" @click="accept(i)">
				<img :src="`${i.parent.avatar_url}?thumbnail&size=32`" alt="">
				<span class="name"><b>{{ i.parent.name }}</b></span>
				<span class="username">@{{ i.parent.username }}</span>
				<mk-time :time="i.created_at"/>
			</div>
		</section>
		<section v-if="myGames.length > 0">
			<h2>自分の対局</h2>
			<a class="game" v-for="g in myGames" tabindex="-1" @click.prevent="go(g)" :href="`/othello/${g.id}`">
				<img :src="`${g.user1.avatar_url}?thumbnail&size=32`" alt="">
				<img :src="`${g.user2.avatar_url}?thumbnail&size=32`" alt="">
				<span><b>{{ g.user1.name }}</b> vs <b>{{ g.user2.name }}</b></span>
				<span class="state">{{ g.is_ended ? '終了' : '進行中' }}</span>
			</a>
		</section>
		<section v-if="games.length > 0">
			<h2>みんなの対局</h2>
			<a class="game" v-for="g in games" tabindex="-1" @click.prevent="go(g)" :href="`/othello/${g.id}`">
				<img :src="`${g.user1.avatar_url}?thumbnail&size=32`" alt="">
				<img :src="`${g.user2.avatar_url}?thumbnail&size=32`" alt="">
				<span><b>{{ g.user1.name }}</b> vs <b>{{ g.user2.name }}</b></span>
				<span class="state">{{ g.is_ended ? '終了' : '進行中' }}</span>
			</a>
		</section>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XGameroom from './othello.gameroom.vue';

export default Vue.extend({
	components: {
		XGameroom
	},
	props: ['initGame'],
	data() {
		return {
			game: null,
			games: [],
			gamesFetching: true,
			gamesMoreFetching: false,
			myGames: [],
			matching: null,
			invitations: [],
			connection: null,
			connectionId: null
		};
	},
	watch: {
		game(g) {
			this.$emit('gamed', g);
		}
	},
	created() {
		if (this.initGame) {
			this.game = this.initGame;
		}
	},
	mounted() {
		this.connection = (this as any).os.streams.othelloStream.getConnection();
		this.connectionId = (this as any).os.streams.othelloStream.use();

		this.connection.on('matched', this.onMatched);
		this.connection.on('invited', this.onInvited);

		(this as any).api('othello/games', {
			my: true
		}).then(games => {
			this.myGames = games;
		});

		(this as any).api('othello/games').then(games => {
			this.games = games;
			this.gamesFetching = false;
		});

		(this as any).api('othello/invitations').then(invitations => {
			this.invitations = this.invitations.concat(invitations);
		});
	},
	beforeDestroy() {
		this.connection.off('matched', this.onMatched);
		this.connection.off('invited', this.onInvited);
		(this as any).os.streams.othelloStream.dispose(this.connectionId);
	},
	methods: {
		go(game) {
			(this as any).api('othello/games/show', {
				game_id: game.id
			}).then(game => {
				this.game = game;
			});
		},
		match() {
			(this as any).apis.input({
				title: 'ユーザー名を入力してください'
			}).then(username => {
				(this as any).api('users/show', {
					username
				}).then(user => {
					(this as any).api('othello/match', {
						user_id: user.id
					}).then(res => {
						if (res == null) {
							this.matching = user;
						} else {
							this.game = res;
						}
					});
				});
			});
		},
		cancel() {
			this.matching = null;
			(this as any).api('othello/match/cancel');
		},
		accept(invitation) {
			(this as any).api('othello/match', {
				user_id: invitation.parent.id
			}).then(game => {
				if (game) {
					this.game = game;
				}
			});
		},
		onMatched(game) {
			this.game = game;
		},
		onInvited(invite) {
			this.invitations.unshift(invite);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-othello
	color #677f84
	background #fff

	> .matching
		> h1
			margin 0
			padding 24px
			font-size 20px
			text-align center
			font-weight normal

		> .cancel
			margin 0 auto
			padding 24px 0 0 0
			max-width 200px
			text-align center
			border-top dashed 1px #c4cdd4

	> .index
		> h1
			margin 0
			padding 24px
			font-size 24px
			text-align center
			font-weight normal
			color #fff
			background linear-gradient(to bottom, #8bca3e, #d6cf31)

			& + p
				margin 0
				padding 12px
				margin-bottom 12px
				text-align center
				font-size 14px
				border-bottom solid 1px #d3d9dc

		> .play
			margin 0 auto
			padding 0 16px
			max-width 500px
			text-align center

			> details
				margin 8px 0

				> div
					padding 16px
					font-size 14px
					text-align left
					background #f5f5f5
					border-radius 8px

		> section
			margin 0 auto
			padding 0 16px 16px 16px
			max-width 500px
			border-top solid 1px #d3d9dc

			> h2
				margin 0
				padding 16px 0 8px 0
				font-size 16px
				font-weight bold

	.invitation
		margin 8px 0
		padding 8px
		border solid 1px #e1e5e8
		border-radius 6px
		cursor pointer

		*
			pointer-events none
			user-select none

		&:focus
			border-color $theme-color

		&:hover
			background #f5f5f5

		&:active
			background #eee

		> img
			vertical-align bottom
			border-radius 100%

		> span
			margin 0 8px
			line-height 32px

	.game
		display block
		margin 8px 0
		padding 8px
		color #677f84
		border solid 1px #e1e5e8
		border-radius 6px
		cursor pointer

		*
			pointer-events none
			user-select none

		&:focus
			border-color $theme-color

		&:hover
			background #f5f5f5

		&:active
			background #eee

		> img
			vertical-align bottom
			border-radius 100%

		> span
			margin 0 8px
			line-height 32px
</style>
