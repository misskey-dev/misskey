<template>
<component :is="deck ? DeckUI : DefaultUI"/>
<!-- Render modals here -->
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DefaultUI from './default.vue';
import DeckUI from './deck.vue';
import { instanceName, deckmode } from './config';

export default defineComponent({
	components: {
		DefaultUI,
		DeckUI,
	},

	metaInfo: {
		title: null,
		titleTemplate: title => title ? `${title} | ${(instanceName || 'Misskey')}` : (instanceName || 'Misskey')
	},

	data() {
		return {
			stream: os.stream,
			isMobile: isMobile,
		};
	},

	methods: {
		dialog(opts) {
			this.$store.commit('showDialog', opts);
		}
	}
});
</script>
