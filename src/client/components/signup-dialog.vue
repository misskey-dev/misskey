<template>
<x-window ref="window" :width="366" :height="506" @closed="() => { $emit('closed'); destroyDom(); }">
	<template #header>{{ $t('signup') }}</template>
	<x-signup :auto-set="autoSet" @signup="onSignup"/>
</x-window>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XWindow from './window.vue';
import XSignup from './signup.vue';
import * as os from '@/os';

export default defineComponent({
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
