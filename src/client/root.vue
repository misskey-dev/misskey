<template>
<DeckUI v-if="deckmode"/>
<DefaultUI v-else/>

<XModal v-for="modal in $store.state.popups.filter(x => x.type === 'modal')" :key="modal.id" @closed="modal.closed" @click="modal.bgClick" :showing="modal.showing" :source="modal.source">
	<component :is="modal.component" v-bind="modal.props" v-on="modal.events" @done="modal.done"/>
</XModal>

<component v-for="popup in $store.state.popups.filter(x => x.type === 'popup')" :key="popup.id" :is="popup.component" v-bind="popup.props" v-on="modal.events" @done="popup.done" @closed="popup.closed"/>

<div id="wait" v-if="$store.state.pendingApiRequestsCount > 0"></div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import DefaultUI from './default.vue';
import DeckUI from './deck.vue';
import { instanceName, deckmode } from '@/config';

export default defineComponent({
	components: {
		DefaultUI,
		DeckUI,
		XModal: defineAsyncComponent(() => import('@/components/modal.vue'))
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
