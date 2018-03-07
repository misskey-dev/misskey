<template>
<div>
	<div v-if="game">
		<x-game :game="game"/>
	</div>
	<div v-if="matching">
		<h1><b>{{ matching.name }}</b>を待っています<mk-ellipsis/></h1>
	</div>
	<div v-else>
		<h1>Misskey Othello</h1>
		<p>他のMisskeyユーザーとオセロで対戦しよう。</p>
		<button>フリーマッチ(準備中)</button>
		<button @click="match">指名</button>
		<section>
			<h2>対局の招待があります:</h2>
		</section>
		<section>
			<h2>過去の対局</h2>
		</section>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XGame from './othello.game.vue';

export default Vue.extend({
	components: {
		XGame
	},
	data() {
		return {
			game: null,
			games: [],
			gamesFetching: true,
			gamesMoreFetching: false,
			matching: false,
			invitations: [],
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		this.connection = (this as any).os.streams.othelloStream.getConnection();
		this.connectionId = (this as any).os.streams.othelloStream.use();

		this.connection.on('macthed', this.onMatched);
		this.connection.on('invited', this.onInvited);

		(this as any).api('othello/games').then(games => {
			this.games = games;
			this.gamesFetching = false;
		});

		(this as any).api('othello/invitations').then(invitations => {
			this.invitations = this.invitations.concat(invitations);
		});
	},
	beforeDestroy() {
		this.connection.off('macthed', this.onMatched);
		this.connection.off('invited', this.onInvited);
		(this as any).streams.othelloStream.dispose(this.connectionId);
	},
	methods: {
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
		onMatched(game) {
			this.game = game;
		},
		onInvited(invite) {
			this.invitations.unshift(invite);
		}
	}
});
</script>

