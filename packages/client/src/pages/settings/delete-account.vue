<template>
<div class="_formRoot">
	<FormInfo warn class="_formBlock">{{ i18n.ts._accountDelete.mayTakeTime }}</FormInfo>
	<FormInfo class="_formBlock">{{ i18n.ts._accountDelete.sendEmail }}</FormInfo>
	<FormButton v-if="!$i.isDeleted" danger class="_formBlock" @click="deleteAccount">{{ i18n.ts._accountDelete.requestAccountDelete }}</FormButton>
	<FormButton v-else disabled>{{ i18n.ts._accountDelete.inProgress }}</FormButton>
</div>
</template>

<script lang="ts" setup>
import FormInfo from '@/components/MkInfo.vue';
import FormButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { signout } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

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
		type: 'password',
	});
	if (canceled) return;

	await os.apiWithDialog('i/delete-account', {
		password: password,
	});

	await os.alert({
		title: i18n.ts._accountDelete.started,
	});

	await signout();
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts._accountDelete.accountDelete,
	icon: 'fas fa-exclamation-triangle',
});
</script>
