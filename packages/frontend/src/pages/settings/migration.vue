<template>
<div class="_gaps_m">
	<FormSection>
		<template #label>{{ i18n.ts.moveTo }}</template>
		<MkInput v-model="moveToAccount" manual-save>
			<template #prefix><i class="ti ti-plane-departure"></i></template>
			<template #label>{{ i18n.ts.moveToLabel }}</template>
		</MkInput>
		<FormInfo warn>{{ i18n.ts.moveAccountDescription }}</FormInfo>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.moveFrom }}</template>
		<MkInput v-model="accountAlias" manual-save>
			<template #prefix><i class="ti ti-plane-arrival"></i></template>
			<template #label>{{ i18n.ts.moveFromLabel }}</template>
		</MkInput>
		<FormInfo warn>{{ i18n.ts.moveFromDescription }}</FormInfo>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import FormSection from '@/components/form/section.vue';
import FormInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const moveToAccount = ref('');
const accountAlias = ref('');

async function move(): Promise<void> {
	const account = moveToAccount.value;
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.t('migrationConfirm', { account: account.toString() }),
	});
	if (confirm.canceled) return;
	os.apiWithDialog('i/move', {
		moveToAccount: account,
	});
}

async function save(): Promise<void> {
	const account = accountAlias.value;
	os.apiWithDialog('i/known-as', {
		alsoKnownAs: account,
	});
}

watch(accountAlias, async () => {
	await save();
});

watch(moveToAccount, async () => {
	await move();
});

definePageMetadata({
	title: i18n.ts.security,
	icon: 'ti ti-lock',
});
</script>

<style lang="scss">
.description {
	font-size: .85em;
	padding: 1rem;
}
</style>
