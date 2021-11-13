<template>
<FormBase>
	<FormInfo warn>{{ $ts._accountDelete.mayTakeTime }}</FormInfo>
	<FormInfo>{{ $ts._accountDelete.sendEmail }}</FormInfo>
	<FormButton @click="deleteAccount" danger v-if="!$i.isDeleted">{{ $ts._accountDelete.requestAccountDelete }}</FormButton>
	<FormButton disabled v-else>{{ $ts._accountDelete.inProgress }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormInfo from '@/components/debobigego/info.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import * as os from '@/os';
import { debug } from '@/config';
import { signout } from '@/account';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		FormGroup,
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
			debug,
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async deleteAccount() {
			const { canceled, result: password } = await os.dialog({
				title: this.$ts.password,
				input: {
					type: 'password'
				}
			});
			if (canceled) return;

			await os.apiWithDialog('i/delete-account', {
				password: password
			});

			await os.dialog({
				title: this.$ts._accountDelete.started,
			});

			signout();
		}
	}
});
</script>
