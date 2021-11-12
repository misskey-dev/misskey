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

	mounted() {
		os.apiWithDialog('signup-pending', {
			code: this.code,
		}).then(res => {
			login(res.i, '/');
		});
	},

	methods: {

	}
});
</script>

<style lang="scss" scoped>

</style>
