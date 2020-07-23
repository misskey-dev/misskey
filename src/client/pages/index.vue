<template>
<component :is="$store.getters.isSignedIn ? 'home' : 'welcome'" :show-title="showTitle"></component>
</template>

<script lang="ts">
import Vue, { defineAsyncComponent } from 'vue';
import Home from './index.home.vue';

export default Vue.extend({
	name: 'Index',

	components: {
		Home,
		Welcome: defineAsyncComponent(() => import('./index.welcome.vue')),
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
