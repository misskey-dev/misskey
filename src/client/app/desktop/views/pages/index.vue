<template>
<component :is="page"></component>
</template>

<script lang="ts">
import Vue from 'vue';
import Home from './home.vue';
import Welcome from './welcome.vue';
import Deck from './deck/deck.vue';

export default Vue.extend({
	components: {
		Home,
		Deck,
		Welcome
	},

	computed: {
		page(): string {
			if (!this.$store.getters.isSignedIn) return 'welcome';
			return this.$store.state.device.deckDefault ? 'deck' : 'home';
		}
	}
});
</script>
