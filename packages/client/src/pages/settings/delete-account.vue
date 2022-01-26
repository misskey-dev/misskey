<template>
<div class="_formRoot">
	<FormInfo warn class="_formBlock">{{ $ts._accountDelete.mayTakeTime }}</FormInfo>
	<FormInfo class="_formBlock">{{ $ts._accountDelete.sendEmail }}</FormInfo>
	<FormButton v-if="!$i.isDeleted" danger class="_formBlock" @click="deleteAccount">{{ $ts._accountDelete.requestAccountDelete }}</FormButton>
	<FormButton v-else disabled>{{ $ts._accountDelete.inProgress }}</FormButton>
</div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormInfo from '@/components/ui/info.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { signout } from '@/account';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormButton,
		FormInfo,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts._accountDelete.accountDelete,
				icon: 'fas fa-exclamation-triangle',
				bg: 'var(--bg)',
			},
		}
	},

	methods: {
		async deleteAccount() {
			{
				const { canceled } = await os.confirm({
					type: 'warning',
					text: this.$ts.deleteAccountConfirm,
				});
				if (canceled) return;
			}

			const { canceled, result: password } = await os.inputText({
				title: this.$ts.password,
				type: 'password'
			});
			if (canceled) return;

			await os.apiWithDialog('i/delete-account', {
				password: password
			});

			await os.alert({
				title: this.$ts._accountDelete.started,
			});

			signout();
		}
	}
});
</script>
