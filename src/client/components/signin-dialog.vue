<template>
<XModalWindow @close="$emit('done')" :width="370" :height="400">
	<template #header>{{ $t('login') }}</template>

	<div class="_section">
		<MkSignin :auto-set="autoSet" @login="onLogin"/>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XModalWindow from './modal-window.vue';
import MkSignin from './signin.vue';

export default defineComponent({
	components: {
		MkSignin,
		XModalWindow,
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
