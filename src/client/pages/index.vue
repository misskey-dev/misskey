<template>
<component :is="$store.getters.isSignedIn ? 'home' : 'welcome'" :show-title="showTitle" ref="page"></component>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import Home from './index.home.vue';
import * as os from '@/os';

export default defineComponent({
	name: 'index',

	components: {
		Home,
		Welcome: defineAsyncComponent(() => import('./index.welcome.vue')),
	},

	data() {
		return {
			info: null,
			showTitle: true,
		}
	},

	activated() {
		this.showTitle = true;
	},

	deactivated() {
		this.showTitle = false;
	},

	mounted() {
		this.$nextTick(() => {
			this.info = this.$refs.page.info;
		});
	},
});
</script>
