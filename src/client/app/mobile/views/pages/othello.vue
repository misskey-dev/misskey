<template>
<mk-ui>
	<span slot="header">%fa:gamepad%オセロ</span>
	<mk-othello v-if="!fetching" :init-game="game" @gamed="onGamed"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	data() {
		return {
			fetching: false,
			game: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	mounted() {
		document.title = 'Misskey オセロ';
		document.documentElement.style.background = '#fff';
	},
	methods: {
		fetch() {
			if (this.$route.params.game == null) return;

			Progress.start();
			this.fetching = true;

			(this as any).api('othello/games/show', {
				gameId: this.$route.params.game
			}).then(game => {
				this.game = game;
				this.fetching = false;

				Progress.done();
			});
		},
		onGamed(game) {
			history.pushState(null, null, '/othello/' + game.id);
		}
	}
});
</script>
