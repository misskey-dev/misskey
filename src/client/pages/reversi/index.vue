<template>
<div class="phgnkghfpyvkrvwiajkiuoxyrdaqpzcx" v-if="!matching">
	<h1>{{ $t('title') }}</h1>
	<p>{{ $t('sub-title') }}</p>
	<div class="play">
		<MkButton primary round @click="match">{{ $t('invite') }}</MkButton>
		<details>
			<summary>{{ $t('rule') }}</summary>
			<div>
				<p>{{ $t('rule-desc') }}</p>
				<dl>
					<dt><b>{{ $t('mode-invite') }}</b></dt>
					<dd>{{ $t('mode-invite-desc') }}</dd>
				</dl>
			</div>
		</details>
	</div>
	<section v-if="invitations.length > 0">
		<h2>{{ $t('invitations') }}</h2>
		<div class="invitation" v-for="i in invitations" tabindex="-1" @click="accept(i)">
			<mk-avatar class="avatar" :user="i.parent"/>
			<span class="name"><b><mk-user-name :user="i.parent"/></b></span>
			<span class="username">@{{ i.parent.username }}</span>
			<mk-time :time="i.createdAt"/>
		</div>
	</section>
	<section v-if="myGames.length > 0">
		<h2>{{ $t('my-games') }}</h2>
		<a class="game" v-for="g in myGames" tabindex="-1" @click.prevent="go(g)" :href="`/games/reversi/${g.id}`">
			<mk-avatar class="avatar" :user="g.user1"/>
			<mk-avatar class="avatar" :user="g.user2"/>
			<span><b><mk-user-name :user="g.user1"/></b> vs <b><mk-user-name :user="g.user2"/></b></span>
			<span class="state">{{ g.isEnded ? $t('game-state.ended') : $t('game-state.playing') }}</span>
			<mk-time :time="g.createdAt" />
		</a>
	</section>
	<section v-if="games.length > 0">
		<h2>{{ $t('all-games') }}</h2>
		<a class="game" v-for="g in games" tabindex="-1" @click.prevent="go(g)" :href="`/games/reversi/${g.id}`">
			<mk-avatar class="avatar" :user="g.user1"/>
			<mk-avatar class="avatar" :user="g.user2"/>
			<span><b><mk-user-name :user="g.user1"/></b> vs <b><mk-user-name :user="g.user2"/></b></span>
			<span class="state">{{ g.isEnded ? $t('game-state.ended') : $t('game-state.playing') }}</span>
			<mk-time :time="g.createdAt" />
		</a>
	</section>
</div>
<div class="matching" v-else>
	<h1>{{ this.$t('matching.waiting-for').split('{}')[0] }}<b><mk-user-name :user="matching"/></b>{{ this.$t('matching.waiting-for').split('{}')[1] }}<mk-ellipsis/></h1>
	<div class="cancel">
		<MkButton round @click="cancel">{{ $t('matching.cancel') }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	inject: ['navHook'],

	data() {
		return {
			games: [],
			gamesFetching: true,
			gamesMoreFetching: false,
			myGames: [],
			matching: null,
			invitations: [],
			connection: null,
			pingClock: null,
		};
	},

	mounted() {
		if (this.$store.getters.isSignedIn) {
			this.connection = os.stream.useSharedConnection('gamesReversi');

			this.connection.on('invited', this.onInvited);

			this.connection.on('matched', this.onMatched);

			this.pingClock = setInterval(() => {
				if (this.matching) {
					this.connection.send('ping', {
						id: this.matching.id
					});
				}
			}, 3000);

			os.api('games/reversi/games', {
				my: true
			}).then(games => {
				this.myGames = games;
			});

			os.api('games/reversi/invitations').then(invitations => {
				this.invitations = this.invitations.concat(invitations);
			});
		}

		os.api('games/reversi/games').then(games => {
			this.games = games;
			this.gamesFetching = false;
		});
	},

	beforeDestroy() {
		if (this.connection) {
			this.connection.dispose();
			clearInterval(this.pingClock);
		}
	},

	methods: {
		go(game) {
			const url = '/games/reversi/' + game.id;
			if (this.navHook) {
				this.navHook(url, defineAsyncComponent(() => import('@/pages/reversi/game.vue')), {
					gameId: game.id
				});
			} else {
				this.$router.push(url);
			}
		},

		async match() {
			const { result: user } = await os.selectUser({ local: true });
			if (user == null) return;
			os.api('games/reversi/match', {
				userId: user.id
			}).then(res => {
				if (res == null) {
					this.matching = user;
				} else {
					this.go(res);
				}
			});
		},

		cancel() {
			this.matching = null;
			os.api('games/reversi/match/cancel');
		},

		accept(invitation) {
			os.api('games/reversi/match', {
				userId: invitation.parent.id
			}).then(game => {
				if (game) {
					this.go(game);
				}
			});
		},

		onMatched(game) {
			this.go(game);
		},

		onInvited(invite) {
			this.invitations.unshift(invite);
		}
	}
});
</script>

<style lang="scss" scoped>
.phgnkghfpyvkrvwiajkiuoxyrdaqpzcx {

}
</style>
