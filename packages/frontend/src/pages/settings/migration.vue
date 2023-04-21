<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label>{{ i18n.ts._accountMigration.moveTo }}</template>
		<div class="_gaps_m">
			<div>
				<MkInput v-model="moveToAccount">
					<template #prefix><i class="ti ti-plane-departure"></i></template>
					<template #label>{{ i18n.ts._accountMigration.moveToLabel }}</template>
				</MkInput>
			</div>
			<div>
				<MkButton inline primary :disabled="!moveToAccount" @click="move"><i class="ti ti-check"></i> {{ i18n.ts.ok }}</MkButton>
			</div>
		</div>
	</FormSection>
	<FormInfo warn>{{ i18n.ts._accountMigration.moveAccountDescription }}</FormInfo>

	<FormSection>
		<template #label>{{ i18n.ts._accountMigration.moveFrom }}</template>
		<div class="_gaps_m">
			<div v-for="(_, i) in accountAliases">
				<MkInput v-model="accountAliases[i]">
					<template #prefix><i class="ti ti-plane-arrival"></i></template>
					<template #label>{{ i18n.ts._accountMigration.moveToLabel }}</template>
				</MkInput>
			</div>
			<div>
				<MkButton :disabled="accountAliases.length >= 5" inline style="margin-right: 8px;" @click="add"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
				<MkButton inline primary @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
			</div>
		</div>
	</FormSection>
	<FormInfo warn>{{ i18n.ts._accountMigration.moveFromDescription }}</FormInfo>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import FormSection from '@/components/form/section.vue';
import FormInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const moveToAccount = ref('');
const accountAliases = ref(['']);

async function move(): Promise<void> {
	const account = moveToAccount.value;
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.t('_accountMigration.migrationConfirm', { account: account.toString() }),
	});
	if (confirm.canceled) return;
	os.apiWithDialog('i/move', {
		moveToAccount: account,
	});
}

function add(): void {
	accountAliases.value.push('');
}

async function save(): Promise<void> {
	const alsoKnownAs = accountAliases.value.map(alias => alias.trim()).filter(alias => alias !== '');
	os.apiWithDialog('i/update', {
		alsoKnownAs,
	});
}

definePageMetadata({
	title: i18n.ts.accountMigration,
	icon: 'ti ti-plane',
});
</script>

<style lang="scss">
.description {
	font-size: .85em;
	padding: 1rem;
}
</style>
