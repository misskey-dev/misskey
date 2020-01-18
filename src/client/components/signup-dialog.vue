<template>
<x-window @closed="() => { $emit('closed'); destroyDom(); }">
	<template #header>{{ $t('signup') }}</template>
	<x-signup/>
</x-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import XWindow from './window.vue';
import XSignup from './signup.vue';

export default Vue.extend({
	i18n,

	components: {
		XSignup,
		XWindow,
	},
});
</script>
