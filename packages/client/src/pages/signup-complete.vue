<template>
<div>
	{{ $ts.processing }}
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { login } from '@/account';

export default defineComponent({
	components: {

	},

	props: {
		code: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.signup,
				icon: 'fas fa-user'
			},
		}
	},

	async mounted() {
		await os.alert({
			type: 'info',
			text: this.$t('clickToFinishEmailVerification', { ok: this.$ts.gotIt }),
		});
		const res = await os.apiWithDialog('signup-pending', {
			code: this.code,
		});
		login(res.i, '/');
	},

	methods: {

	}
});
</script>

<style lang="scss" scoped>

</style>
