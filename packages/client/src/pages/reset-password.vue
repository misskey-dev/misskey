<template>
<MkSpacer v-if="token" :content-max="700" :margin-min="16" :margin-max="32">
	<div class="_formRoot">
		<FormInput v-model="password" type="password" class="_formBlock">
			<template #prefix><i class="fas fa-lock"></i></template>
			<template #label>{{ $ts.newPassword }}</template>
		</FormInput>
		
		<FormButton primary class="_formBlock" @click="save">{{ $ts.save }}</FormButton>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
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
				icon: 'fas fa-lock',
				bg: 'var(--bg)',
			},
			password: '',
		}
	},

	mounted() {
		if (this.token == null) {
			os.popup(import('@/components/forgot-password.vue'), {}, {}, 'closed');
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
