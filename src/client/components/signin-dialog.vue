<template>
<XModalWindow ref="dialog"
	:width="370"
	:height="400"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ $t('login') }}</template>

	<MkSignin :auto-set="autoSet" @login="onLogin"/>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XModalWindow from '@/components/ui/modal-window.vue';
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

	emits: ['done', 'closed'],

	methods: {
		onLogin(res) {
			this.$emit('done', res);
			this.$refs.dialog.close();
		}
	}
});
</script>
