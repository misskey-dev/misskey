<template>
<div class="_gaps_m">
	<MkFolder :default-open="true">
		<template #icon><i class="ti ti-plane-arrival"></i></template>
		<template #label>{{ i18n.ts._accountMigration.moveFrom }}</template>
		<template #caption>{{ i18n.ts._accountMigration.moveFromSub }}</template>

		<div class="_gaps_m">
			<FormInfo warn>
				{{ i18n.ts._accountMigration.moveFromDescription }}
			</FormInfo>
			<div>
				<MkButton :disabled="accountAliases.length >= 10" inline style="margin-right: 8px;" @click="add"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
				<MkButton inline primary @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
			</div>
			<div class="_gaps">
				<MkInput v-for="(_, i) in accountAliases" v-model="accountAliases[i]">
					<template #prefix><i class="ti ti-plane-arrival"></i></template>
					<template #label>{{ i18n.t('_accountMigration.moveFromLabel', { n: i + 1 }) }}</template>
				</MkInput>
			</div>
		</div>
	</MkFolder>

	<MkFolder :default-open="false">
		<template #icon><i class="ti ti-plane-departure"></i></template>
		<template #label>{{ i18n.ts._accountMigration.moveTo }}</template>

		<div class="_gaps_m">
			<FormInfo warn>{{ i18n.ts._accountMigration.moveAccountDescription }}</FormInfo>
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
	</MkFolder>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import FormInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
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
	accountAliases.value = alsoKnownAs.length === 0 ? [''] : alsoKnownAs;
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
