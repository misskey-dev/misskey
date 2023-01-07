<template>
<div class="_gaps_m">
	<FormInfo warn>{{ i18n.ts._accountDelete.mayTakeTime }}</FormInfo>
	<FormInfo>{{ i18n.ts._accountDelete.sendEmail }}</FormInfo>
	<MkButton v-if="!$i.isDeleted" danger @click="deleteAccount">{{ i18n.ts._accountDelete.requestAccountDelete }}</MkButton>
	<MkButton v-else disabled>{{ i18n.ts._accountDelete.inProgress }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import FormInfo from '@/components/MkInfo.vue';
import MkButton from '@/components/MkButton.vue';
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
	icon: 'ti ti-alert-triangle',
});
</script>
