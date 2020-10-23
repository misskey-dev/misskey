<template>
<div class="vchtoekanapleubgzioubdtmlkribzfd">
	<div v-if="game">
		<x-gameroom :game="game" :self-nav="selfNav" @go-index="goIndex"/>
	</div>
	<div class="matching" v-else-if="matching">
		<h1>{{ this.$t('matching.waiting-for').split('{}')[0] }}<b><mk-user-name :user="matching"/></b>{{ this.$t('matching.waiting-for').split('{}')[1] }}<mk-ellipsis/></h1>
		<div class="cancel">
			<form-button round @click="cancel">{{ $t('matching.cancel') }}</form-button>
		</div>
	</div>
	<div v-else-if="gameId">
		...
	</div>
	<div class="index" v-else>
		<x-index @go="nav" @matching="onMatching"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XGameroom from './reversi.gameroom.vue';
import XIndex from './reversi.index.vue';
import Progress from '../../../../scripts/loading';

export default defineComponent({
	components: {
		XGameroom,
		XIndex
	},

	props: {
		gameId: {
			type: String,
			required: false
		},
		selfNav: {
			type: Boolean,
			require: false,
			default: true
		}
	},

	data() {
		return {
			game: null,
			matching: null,
			connection: null,
			pingClock: null
		};
	},

	watch: {
		game() {
			this.$emit('gamed', this.game);
		},

		gameId() {
			this.fetch();
		}
	},

	mounted() {
		this.fetch();

		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('gamesReversi');

			this.connection.on('matched', this.onMatched);

			this.pingClock = setInterval(() => {
				if (this.matching) {
					this.connection.send('ping', {
						id: this.matching.id
					});
				}
			}, 3000);
		}
	},

	beforeDestroy() {
		if (this.connection) {
			this.connection.dispose();
			clearInterval(this.pingClock);
		}
	},

	methods: {
		fetch() {
			if (this.gameId == null) {
				this.game = null;
			} else {
				Progress.start();
				this.$root.api('games/reversi/games/show', {
					gameId: this.gameId
				}).then(game => {
					this.game = game;
					Progress.done();
				});
			}
		},

		async nav(game, actualNav = true) {
			if (this.selfNav) {
				// 受け取ったゲーム情報が省略されたものなら完全な情報を取得する
				if (game != null && game.map == null) {
					game = await this.$root.api('games/reversi/games/show', {
						gameId: game.id
					});
				}

				this.game = game;
			} else {
				this.$emit('nav', game, actualNav);
			}
		},

		onMatching(user) {
			this.matching = user;
		},

		cancel() {
			this.matching = null;
			this.$root.api('games/reversi/match/cancel');
		},

		accept(invitation) {
			this.$root.api('games/reversi/match', {
				userId: invitation.parent.id
			}).then(game => {
				if (game) {
					this.matching = null;

					this.nav(game);
				}
			});
		},

		onMatched(game) {
			this.matching = null;
			this.game = game;
			this.nav(game, false);
		},

		goIndex() {
			this.nav(null);
		}
	}
});
</script>

<style lang="stylus" scoped>
.vchtoekanapleubgzioubdtmlkribzfd
	color var(--text)
	background var(--bg)

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

</style>