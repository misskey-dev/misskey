<template>
<div class="_formRoot">
	<FormInfo warn class="_formBlock">{{ i18n.ts._accountDelete.mayTakeTime }}</FormInfo>
	<FormInfo class="_formBlock">{{ i18n.ts._accountDelete.sendEmail }}</FormInfo>
	<FormButton v-if="!$i.isDeleted" danger class="_formBlock" @click="deleteAccount">{{ i18n.ts._accountDelete.requestAccountDelete }}</FormButton>
	<FormButton v-else disabled>{{ i18n.ts._accountDelete.inProgress }}</FormButton>
</div>
</template>

<script lang="ts" setup>
import { defineExpose } from 'vue';
import FormInfo from '@/components/ui/info.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { signout } from '@/account';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

async function deleteAccount() {
	{
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.ts.deleteAccountConfirm,
		});
		if (canceled) return;
	}

	const { canceled, result: password } = await os.inputText({
		title: i18n.ts.password,
		type: 'password'
	});
	if (canceled) return;

	await os.apiWithDialog('i/delete-account', {
		password: password
	});

	await os.alert({
		title: i18n.ts._accountDelete.started,
	});

	await signout();
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts._accountDelete.accountDelete,
		icon: 'fas fa-exclamation-triangle',
		bg: 'var(--bg)',
	}
});
</script>
