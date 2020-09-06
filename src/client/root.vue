<template>
<DeckUI v-if="deckmode"/>
<DefaultUI v-else/>

<component v-for="dialog in $store.state.dialogs" :is="dialog.component" v-bind="dialog.props" :key="dialog.id"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DefaultUI from './default.vue';
import DeckUI from './deck.vue';
import { instanceName, deckmode } from '@/config';

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
});
</script>
