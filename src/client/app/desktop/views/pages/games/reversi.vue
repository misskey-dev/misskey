<template>
<component :is="ui ? 'mk-ui' : 'div'">
	<mk-reversi :game-id="$route.params.game" @nav="nav" :self-nav="false"/>
</component>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		ui: {
			default: false
		}
	},
	methods: {
		nav(game, actualNav) {
			if (actualNav) {
				this.$router.push(`/reversi/${game.id}`);
			} else {
				// TODO: https://github.com/vuejs/vue-router/issues/703
				this.$router.push(`/reversi/${game.id}`);
			}
		}
	}
});
</script>
