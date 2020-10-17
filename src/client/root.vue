<template>
<ZenUI v-if="zen"/>
<VisitorUI v-else-if="!$store.getters.isSignedIn"/>
<DeckUI v-else-if="deckmode"/>
<DefaultUI v-else/>

<component v-for="popup in popups"
	:key="popup.id"
	:is="popup.component"
	v-bind="popup.props"
	v-on="popup.events"
/>

<XUpload v-if="uploads.length > 0"/>

<div id="wait" v-if="pendingApiRequestsCount > 0"></div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { deckmode } from '@/config';
import { popups, uploads, pendingApiRequestsCount } from '@/os';

export default defineComponent({
	components: {
		DefaultUI: defineAsyncComponent(() => import('@/ui/default.vue')),
		DeckUI: defineAsyncComponent(() => import('@/ui/deck.vue')),
		ZenUI: defineAsyncComponent(() => import('@/ui/zen.vue')),
		VisitorUI: defineAsyncComponent(() => import('@/ui/visitor.vue')),
		XUpload: defineAsyncComponent(() => import('@/components/upload.vue')),
	},

	setup() {
		return {
			zen: window.location.search === '?zen',
			deckmode,
			uploads,
			popups,
			pendingApiRequestsCount,
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
