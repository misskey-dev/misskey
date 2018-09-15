<template>
<div class="phgnkghfpyvkrvwiajkiuoxyrdaqpzcx">
	<h1>%i18n:@title%</h1>
	<p>%i18n:@sub-title%</p>
	<div class="play">
		<form-button primary round @click="match">%i18n:@invite%</form-button>
		<details>
			<summary>%i18n:@rule%</summary>
			<div>
				<p>%i18n:@rule-desc%</p>
				<dl>
					<dt><b>%i18n:@mode-invite%</b></dt>
					<dd>%i18n:@mode-invite-desc%</dd>
				</dl>
			</div>
		</details>
	</div>
	<section v-if="invitations.length > 0">
		<h2>%i18n:@invitations%</h2>
		<div class="invitation" v-for="i in invitations" tabindex="-1" @click="accept(i)">
			<mk-avatar class="avatar" :user="i.parent"/>
			<span class="name"><b>{{ i.parent | userName }}</b></span>
			<span class="username">@{{ i.parent.username }}</span>
			<mk-time :time="i.createdAt"/>
		</div>
	</section>
	<section v-if="myGames.length > 0">
		<h2>%i18n:@my-games%</h2>
		<a class="game" v-for="g in myGames" tabindex="-1" @click.prevent="go(g)" :href="`/reversi/${g.id}`">
			<mk-avatar class="avatar" :user="g.user1"/>
			<mk-avatar class="avatar" :user="g.user2"/>
			<span><b>{{ g.user1 | userName }}</b> vs <b>{{ g.user2 | userName }}</b></span>
			<span class="state">{{ g.isEnded ? '%i18n:@game-state.ended%' : '%i18n:@game-state.playing%' }}</span>
			<mk-time :time="g.createdAt" />
		</a>
	</section>
	<section v-if="games.length > 0">
		<h2>%i18n:@all-games%</h2>
		<a class="game" v-for="g in games" tabindex="-1" @click.prevent="go(g)" :href="`/reversi/${g.id}`">
			<mk-avatar class="avatar" :user="g.user1"/>
			<mk-avatar class="avatar" :user="g.user2"/>
			<span><b>{{ g.user1 | userName }}</b> vs <b>{{ g.user2 | userName }}</b></span>
			<span class="state">{{ g.isEnded ? '%i18n:@game-state.ended%' : '%i18n:@game-state.playing%' }}</span>
			<mk-time :time="g.createdAt" />
		</a>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
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

	mounted() {
		if (this.$store.getters.isSignedIn) {
			this.connection = (this as any).os.streams.reversiStream.getConnection();
			this.connectionId = (this as any).os.streams.reversiStream.use();

			this.connection.on('invited', this.onInvited);

			(this as any).api('games/reversi/games', {
				my: true
			}).then(games => {
				this.myGames = games;
			});

			(this as any).api('games/reversi/invitations').then(invitations => {
				this.invitations = this.invitations.concat(invitations);
			});
		}

		(this as any).api('games/reversi/games').then(games => {
			this.games = games;
			this.gamesFetching = false;
		});
	},

	beforeDestroy() {
		if (this.connection) {
			this.connection.off('invited', this.onInvited);
			(this as any).os.streams.reversiStream.dispose(this.connectionId);
		}
	},

	methods: {
		go(game) {
			this.$emit('go', game);
		},

		match() {
			(this as any).apis.input({
				title: '%i18n:@enter-username%'
			}).then(username => {
				(this as any).api('users/show', {
					username
				}).then(user => {
					(this as any).api('games/reversi/match', {
						userId: user.id
					}).then(res => {
						if (res == null) {
							this.$emit('matching', user);
						} else {
							this.$emit('go', res);
						}
					});
				});
			});
		},

		accept(invitation) {
			(this as any).api('games/reversi/match', {
				userId: invitation.parent.id
			}).then(game => {
				if (game) {
					this.$emit('go', game);
				}
			});
		},

		onInvited(invite) {
			this.invitations.unshift(invite);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	> h1
		margin 0
		padding 24px
		font-size 24px
		text-align center
		font-weight normal
		color #fff
		background linear-gradient(to bottom, isDark ? #45730e : #8bca3e, isDark ? #464300 : #d6cf31)

		& + p
			margin 0
			padding 12px
			margin-bottom 12px
			text-align center
			font-size 14px
			border-bottom solid 1px isDark ? #535f65 : #d3d9dc

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
				background isDark ? #282c37 : #f5f5f5
				border-radius 8px

	> section
		margin 0 auto
		padding 0 16px 16px 16px
		max-width 500px
		border-top solid 1px isDark ? #535f65 : #d3d9dc

		> h2
			margin 0
			padding 16px 0 8px 0
			font-size 16px
			font-weight bold

	.invitation
		margin 8px 0
		padding 8px
		color isDark ? #fff : #677f84
		background isDark ? #282c37 : #fff
		box-shadow 0 2px 16px rgba(#000, isDark ? 0.7 : 0.15)
		border-radius 6px
		cursor pointer

		*
			pointer-events none
			user-select none

		&:focus
			border-color $theme-color

		&:hover
			background isDark ? #313543 : #f5f5f5

		&:active
			background isDark ? #1e222b : #eee

		> .avatar
			width 32px
			height 32px
			border-radius 100%

		> span
			margin 0 8px
			line-height 32px

	.game
		display block
		margin 8px 0
		padding 8px
		color isDark ? #fff : #677f84
		background isDark ? #282c37 : #fff
		box-shadow 0 2px 16px rgba(#000, isDark ? 0.7 : 0.15)
		border-radius 6px
		cursor pointer

		*
			pointer-events none
			user-select none

		&:hover
			background isDark ? #313543 : #f5f5f5

		&:active
			background isDark ? #1e222b : #eee

		> .avatar
			width 32px
			height 32px
			border-radius 100%

		> span
			margin 0 8px
			line-height 32px

.phgnkghfpyvkrvwiajkiuoxyrdaqpzcx[data-darkmode]
	root(true)

.phgnkghfpyvkrvwiajkiuoxyrdaqpzcx:not([data-darkmode])
	root(false)

</style>
