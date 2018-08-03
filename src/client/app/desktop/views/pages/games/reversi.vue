<template>
<component :is="ui ? 'mk-ui' : 'div'">
	<mk-reversi :game-id="$route.params.game" @nav="nav"/>
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
		nav(game) {
			history.pushState(null, null, '/reversi/' + game.id);
		},
	}
});
</script>
