<template>
<x-window ref="window" @closed="() => { $emit('closed'); destroyDom(); }">
	<template #header>{{ $t('signup') }}</template>
	<x-signup :auto-set="autoSet" @signup="onSignup"/>
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

	props: {
		autoSet: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	methods: {
		onSignup(res) {
			this.$emit('signup', res);
			this.$refs.window.close();
		}
	}
});
</script>
