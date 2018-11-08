<template>
<component :is="$store.getters.isSignedIn ? 'home' : 'welcome'"></component>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Home from './home.vue';
import Welcome from './welcome.vue';

export default Vue.extend({
	i18n: i18n('.vue'),
	components: {
		Home,
		Welcome
	}
});
</script>
