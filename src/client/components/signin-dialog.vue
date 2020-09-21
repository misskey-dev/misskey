<template>
<x-window @close="$emit('done')">
	<template #header>{{ $t('login') }}</template>
	<mk-signin :auto-set="autoSet" @login="onLogin"/>
</x-window>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XWindow from './window.vue';
import MkSignin from './signin.vue';
import * as os from '@/os';

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

	emits: ['done'],

	methods: {
		onLogin(res) {
			this.$emit('done', res);
		}
	}
});
</script>
