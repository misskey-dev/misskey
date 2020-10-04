<template>
<VisitorUI v-if="!$store.getters.isSignedIn"/>
<DeckUI v-else-if="deckmode"/>
<DefaultUI v-else/>

<XModal v-for="modal in modals"
	:key="modal.id"
	@closed="modal.closed"
	@click="modal.bgClick"
	:showing="modal.showing"
	:source="modal.source"
	:position="modal.position"
>
	<component :is="modal.component" v-bind="modal.props" v-on="modal.events" @done="modal.done"/>
</XModal>

<component v-for="popup in popups"
	:key="popup.id"
	:is="popup.component"
	v-bind="popup.props"
	:showing="popup.showing"
	v-on="popup.events"
	@closed="popup.closed"
/>

<XUpload v-if="uploads.length > 0"/>

<div id="wait" v-if="$store.state.pendingApiRequestsCount > 0"></div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent } from 'vue';
import { deckmode } from '@/config';
import { uploads } from '@/os';
import { store } from '@/store';

export default defineComponent({
	components: {
		DefaultUI: defineAsyncComponent(() => import('@/ui/default.vue')),
		DeckUI: defineAsyncComponent(() => import('@/ui/deck.vue')),
		VisitorUI: defineAsyncComponent(() => import('@/ui/visitor.vue')),
		XModal: defineAsyncComponent(() => import('@/components/modal.vue')),
		XUpload: defineAsyncComponent(() => import('@/components/upload.vue')),
	},

	setup() {
		return {
			modals: computed(() => store.state.popups.filter(x => x.type === 'modal')),
			popups: computed(() => store.state.popups.filter(x => x.type === 'popup')),
			deckmode,
			uploads,
		};
	},
});
</script>

<style lang="scss">
#wait {
	display: block;
	position: fixed;
	z-index: 10000;
	top: 15px;
	right: 15px;

	&:before {
		content: "";
		display: block;
		width: 18px;
		height: 18px;
		box-sizing: border-box;
		border: solid 2px transparent;
		border-top-color: var(--accent);
		border-left-color: var(--accent);
		border-radius: 50%;
		animation: progress-spinner 400ms linear infinite;
	}
}

@keyframes progress-spinner {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
