<template>
<div v-if="game == null"><MkLoading/></div>
<GameSetting v-else-if="!game.isStarted" :init-game="game" :connection="connection"/>
<GameBoard v-else :init-game="game" :connection="connection"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import GameSetting from './game.setting.vue';
import GameBoard from './game.board.vue';
import * as os from '@client/os';
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		GameSetting,
		GameBoard,
	},

	props: {
		gameId: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts._reversi.reversi,
				icon: 'fas fa-gamepad'
			},
			game: null,
			connection: null,
		};
	},

	watch: {
		gameId() {
			this.fetch();
		}
	},

	mounted() {
		this.fetch();
	},

	beforeUnmount() {
		if (this.connection) {
			this.connection.dispose();
		}
	},

	methods: {
		fetch() {
			os.api('games/reversi/games/show', {
				gameId: this.gameId
			}).then(game => {
				this.game = game;

				if (this.connection) {
					this.connection.dispose();
				}
				this.connection = os.stream.connectToChannel('gamesReversiGame', {
					gameId: this.game.id
				});
				this.connection.on('started', this.onStarted);
			});
		},

		onStarted(game) {
			Object.assign(this.game, game);
		},
	}
});
</script>
