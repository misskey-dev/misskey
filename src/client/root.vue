<template>
<component :is="deck ? DeckUI : DefaultUI"/>
<!-- Render modals here -->
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

	metaInfo: {
		title: null,
		titleTemplate: title => title ? `${title} | ${(instanceName || 'Misskey')}` : (instanceName || 'Misskey')
	},

	data() {
		return {
			stream: os.stream,
			isMobile: isMobile,
			i18n // TODO: 消せないか考える SEE: https://github.com/syuilo/misskey/pull/6396#discussion_r429511030
		};
	},

	methods: {
		dialog(opts) {
			this.$store.commit('showDialog', opts);
		}
	}
});
</script>
