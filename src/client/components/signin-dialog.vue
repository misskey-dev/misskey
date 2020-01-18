<template>
<x-window @closed="() => { $emit('closed'); destroyDom(); }">
	<template #header>{{ $t('login') }}</template>
	<x-signin/>
</x-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import XWindow from './window.vue';
import XSignin from './signin.vue';

export default Vue.extend({
	i18n,

	components: {
		XSignin,
		XWindow,
	},
});
</script>
