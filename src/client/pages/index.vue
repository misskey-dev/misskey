<template>
<component :is="$store.getters.isSignedIn ? 'home' : 'welcome'" :show-title="showTitle"></component>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import Home from './index.home.vue';

export default defineComponent({
	name: 'index',

	components: {
		Home,
		Welcome: defineAsyncComponent(() => import('./index.welcome.vue').then(m => m.default)),
	},

	data() {
		return {
			showTitle: true,
		}
	},

	activated() {
		this.showTitle = true;
	},

	deactivated() {
		this.showTitle = false;
	}
});
</script>
