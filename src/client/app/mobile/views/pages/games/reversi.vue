<template>
<mk-ui>
	<span slot="header">%fa:gamepad%%i18n:@reversi%</span>
	<mk-reversi :game-id="$route.params.game" @nav="nav" :self-nav="false"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	mounted() {
		document.title = `${(this as any).os.instanceName} %i18n:@reversi%`;
		document.documentElement.style.background = '#fff';
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
