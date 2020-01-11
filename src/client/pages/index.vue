<template>
<component :is="$store.getters.isSignedIn ? 'home' : 'welcome'"></component>
</template>

<script lang="ts">
import Vue from 'vue';
import Home from './index.home.vue';

export default Vue.extend({
	components: {
		Home,
		Welcome: () => import('./index.welcome.vue').then(m => m.default),
	}
});
</script>
