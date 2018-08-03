<template>
<mk-ui>
	<span slot="header">%fa:gamepad%%i18n:@reversi%</span>
	<mk-reversi :game-id="$route.params.game" @nav="nav"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	mounted() {
		document.title = '%i18n:common.name% %i18n:@reversi%';
		document.documentElement.style.background = '#fff';
	},
	methods: {
		nav(game) {
			history.pushState(null, null, '/reversi/' + game.id);
		}
	}
});
</script>
