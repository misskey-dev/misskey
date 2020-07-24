<template>
<x-window ref="window" @closed="() => { $emit('closed'); destroyDom(); }">
	<template #header>{{ $t('login') }}</template>
	<mk-signin :auto-set="autoSet" @login="onLogin"/>
</x-window>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XWindow from './window.vue';
import MkSignin from './signin.vue';

export default defineComponent({
	components: {
		MkSignin,
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
		onLogin(res) {
			this.$emit('login', res);
			this.$refs.window.close();
		}
	}
});
</script>
