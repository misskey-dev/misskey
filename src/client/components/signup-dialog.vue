<template>
<XWindow :width="366" :height="500" @close="$emit('done')">
	<template #header>{{ $t('signup') }}</template>

	<div class="_section">
		<XSignup :auto-set="autoSet" @signup="onSignup"/>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XWindow from './window.vue';
import XSignup from './signup.vue';

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

	emits: ['done'],

	methods: {
		onSignup(res) {
			this.$emit('done', res);
		}
	}
});
</script>
