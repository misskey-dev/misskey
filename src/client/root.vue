<template>
<component :is="deck ? DeckUI : DefaultUI"/>
</template>

<script lang="ts">
import Vue from 'vue';
import DefaultUI from './default.vue';
import DeckUI from './deck.vue';

export default Vue.extend({
	components: {
		DefaultUI,
		DeckUI,
	},

	data() {
		return {
		};
	},

	methods: {
		dialog(opts) {
			//this.$store.openDialog();
		}
	}
});
</script>
