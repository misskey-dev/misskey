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
import FormInfo from '@client/components/form/info.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import * as os from '@client/os';
import { debug } from '@client/config';
import { signout } from '@client/account';
import * as symbols from '@client/symbols';

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
				icon: 'fas fa-exclamation-triangle'
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
