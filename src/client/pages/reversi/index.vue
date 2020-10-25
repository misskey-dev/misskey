<template>
<div class="bgvwxkhb" v-if="!matching">
	<h1>Misskey Reversi</h1>
	<div class="play">
		<MkButton primary round @click="match">{{ $t('invite') }}</MkButton>
	</div>
	<section v-if="invitations.length > 0">
		<h2>{{ $t('invitations') }}</h2>
		<button class="invitation _panel _button" v-for="invitation in invitations" tabindex="-1" @click="accept(invitation)">
			<mk-avatar class="avatar" :user="invitation.parent"/>
			<span class="name"><b><mk-user-name :user="invitation.parent"/></b></span>
			<span class="username">@{{ invitation.parent.username }}</span>
			<mk-time :time="invitation.createdAt"/>
		</button>
	</section>
	<section v-if="myGames.length > 0">
		<h2>{{ $t('my-games') }}</h2>
		<MkA class="game _panel" v-for="g in myGames" tabindex="-1" :href="`/games/reversi/${g.id}`">
			<mk-avatar class="avatar" :user="g.user1"/>
			<mk-avatar class="avatar" :user="g.user2"/>
			<span><b><mk-user-name :user="g.user1"/></b> vs <b><mk-user-name :user="g.user2"/></b></span>
			<span class="state">{{ g.isEnded ? $t('game-state.ended') : $t('game-state.playing') }}</span>
			<mk-time :time="g.createdAt" />
		</MkA>
	</section>
	<section v-if="games.length > 0">
		<h2>{{ $t('all-games') }}</h2>
		<MkA class="game _panel" v-for="g in games" tabindex="-1" :href="`/games/reversi/${g.id}`">
			<mk-avatar class="avatar" :user="g.user1"/>
			<mk-avatar class="avatar" :user="g.user2"/>
			<span><b><mk-user-name :user="g.user1"/></b> vs <b><mk-user-name :user="g.user2"/></b></span>
			<span class="state">{{ g.isEnded ? $t('game-state.ended') : $t('game-state.playing') }}</span>
			<mk-time :time="g.createdAt" />
		</MkA>
	</section>
</div>
<div class="sazhgisb" v-else>
	<h1>
		<i18n-t keypath="waitingFor" tag="span">
			<template #x>
				<b><mk-user-name :user="matching"/></b>
			</template>
		</i18n-t>
		<mk-ellipsis/>
	</h1>
	<div class="cancel">
		<MkButton inline round @click="cancel">{{ $t('cancel') }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';
import MkButton from '@/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton
	},

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
				this.navHook(url);
			} else {
				this.$router.push(url);
			}
		},

		async match() {
			const user = await os.selectUser({ local: true });
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
.bgvwxkhb {

}

.sazhgisb {
	text-align: center;
}
</style>
