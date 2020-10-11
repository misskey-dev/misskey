<template>
<XWindow @close="$emit('done')" :width="370" :height="400">
	<template #header>{{ $t('login') }}</template>

	<div class="_section">
		<MkSignin :auto-set="autoSet" @login="onLogin"/>
	</div>
</XWindow>
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

	emits: ['done'],

	methods: {
		onLogin(res) {
			this.$emit('done', res);
		}
	}
});
</script>
