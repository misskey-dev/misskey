<template>
<component :is="ui ? 'mk-ui' : 'div'">
	<mk-othello v-if="!fetching" :init-game="game" @gamed="onGamed"/>
</component>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	props: {
		ui: {
			default: false
		}
	},
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
	methods: {
		fetch() {
			if (this.$route.params.game == null) return;

			Progress.start();
			this.fetching = true;

			(this as any).api('othello/games/show', {
				game_id: this.$route.params.game
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
