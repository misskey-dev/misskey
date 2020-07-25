<template>
<DeckUI v-if="deckmode"/>
<DefaultUI v-else/>
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

	props: {
		// TODO: propで渡すとvueによって無駄なobserveがされるのでどうにかする
		stream: {

		},
		isMobile: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	data() {
		return {
			deckmode
		};
	},

	methods: {
		api(endpoint: string, data: { [x: string]: any } = {}, token?) {
			return this.$store.dispatch('api', { endpoint, data, token });
		},

		dialog(opts) {
			this.$store.commit('showDialog', opts);
		}
	}
});
</script>
