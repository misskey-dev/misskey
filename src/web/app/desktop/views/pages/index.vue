<template>
	<component v-bind:is="os.isSignedIn ? 'home' : 'welcome'"></component>
</template>

<script lang="ts">
import Vue from 'vue';
import HomeView from './home.vue';
import WelcomeView from './welcome.vue';

export default Vue.extend({
	props: ['os'],
	components: {
		home: HomeView,
		welcome: WelcomeView
	}
});
</script>
