<template>
<FormBase v-if="token">
	<FormInput v-model:value="password" type="password">
		<template #prefix><i class="fas fa-lock"></i></template>
		<span>{{ $ts.newPassword }}</span>
	</FormInput>
	
	<FormButton primary @click="save">{{ $ts.save }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormInput from '@client/components/form/input.vue';
import FormButton from '@client/components/form/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormGroup,
		FormLink,
		FormInput,
		FormButton,
	},

	props: {
		token: {
			type: String,
			required: false
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.resetPassword,
				icon: 'fas fa-lock'
			},
			password: '',
		}
	},

	mounted() {
		if (this.token == null) {
			os.popup(import('@client/components/forgot-password.vue'), {}, {}, 'closed');
			this.$router.push('/');
		}
	},

	methods: {
		async save() {
			await os.apiWithDialog('reset-password', {
				token: this.token,
				password: this.password,
			});
			this.$router.push('/');
		}
	}
});
</script>

<style lang="scss" scoped>

</style>
