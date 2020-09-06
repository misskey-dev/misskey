<template>
<DeckUI v-if="deckmode"/>
<DefaultUI v-else/>

<component v-for="popup in $store.state.popups" :is="popup.component" v-bind="popup.props" :key="popup.id" @done="popup.done" @closed="popup.closed"/>

<div id="wait" v-if="$store.state.pendingApiRequestsCount > 0"></div>
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

	data() {
		return {
			deckmode
		};
	},
});
</script>
