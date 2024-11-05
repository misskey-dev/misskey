<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label><i class="ti ti-pencil"></i> {{ i18n.ts._exportOrImport.allNotes }}</template>
		<MkFolder>
			<template #label>{{ i18n.ts.export }}</template>
			<template #icon><i class="ti ti-download"></i></template>
			<MkButton primary :class="$style.button" inline @click="exportNotes()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
		</MkFolder>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-star"></i> {{ i18n.ts._exportOrImport.favoritedNotes }}</template>
		<MkFolder>
			<template #label>{{ i18n.ts.export }}</template>
			<template #icon><i class="ti ti-download"></i></template>
			<MkButton primary :class="$style.button" inline @click="exportFavorites()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
		</MkFolder>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-star"></i> {{ i18n.ts._exportOrImport.clips }}</template>
		<MkFolder>
			<template #label>{{ i18n.ts.export }}</template>
			<template #icon><i class="ti ti-download"></i></template>
			<MkButton primary :class="$style.button" inline @click="exportClips()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
		</MkFolder>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-users"></i> {{ i18n.ts._exportOrImport.followingList }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<div class="_gaps_s">
					<MkSwitch v-model="excludeMutingUsers">
						{{ i18n.ts._exportOrImport.excludeMutingUsers }}
					</MkSwitch>
					<MkSwitch v-model="excludeInactiveUsers">
						{{ i18n.ts._exportOrImport.excludeInactiveUsers }}
					</MkSwitch>
					<MkButton primary :class="$style.button" inline @click="exportFollowing()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
				</div>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportFollowing">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkSwitch v-model="withReplies">
					{{ i18n.ts._exportOrImport.withReplies }}
				</MkSwitch>
				<MkButton primary :class="$style.button" inline @click="importFollowing($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-users"></i> {{ i18n.ts._exportOrImport.userLists }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<MkButton primary :class="$style.button" inline @click="exportUserLists()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportUserLists">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkButton primary :class="$style.button" inline @click="importUserLists($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-user-off"></i> {{ i18n.ts._exportOrImport.muteList }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<MkButton primary :class="$style.button" inline @click="exportMuting()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportMuting">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkButton primary :class="$style.button" inline @click="importMuting($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-user-off"></i> {{ i18n.ts._exportOrImport.blockingList }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<MkButton primary :class="$style.button" inline @click="exportBlocking()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportBlocking">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkButton primary :class="$style.button" inline @click="importBlocking($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-antenna"></i> {{ i18n.ts.antennas }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<MkButton primary :class="$style.button" inline @click="exportAntennas()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportAntennas">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkButton primary :class="$style.button" inline @click="importAntennas($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { selectFile } from '@/scripts/select-file.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { $i } from '@/account.js';
import { defaultStore } from '@/store.js';

const excludeMutingUsers = ref(false);
const excludeInactiveUsers = ref(false);
const withReplies = ref(defaultStore.state.defaultWithReplies);

const onExportSuccess = () => {
	os.alert({
		type: 'info',
		text: i18n.ts.exportRequested,
	});
};

const onImportSuccess = () => {
	os.alert({
		type: 'info',
		text: i18n.ts.importRequested,
	});
};

const onError = (ev) => {
	os.alert({
		type: 'error',
		text: ev.message,
	});
};

const exportNotes = () => {
	misskeyApi('i/export-notes', {}).then(onExportSuccess).catch(onError);
};

const exportFavorites = () => {
	misskeyApi('i/export-favorites', {}).then(onExportSuccess).catch(onError);
};

const exportClips = () => {
	misskeyApi('i/export-clips', {}).then(onExportSuccess).catch(onError);
};

const exportFollowing = () => {
	misskeyApi('i/export-following', {
		excludeMuting: excludeMutingUsers.value,
		excludeInactive: excludeInactiveUsers.value,
	})
		.then(onExportSuccess).catch(onError);
};

const exportBlocking = () => {
	misskeyApi('i/export-blocking', {}).then(onExportSuccess).catch(onError);
};

const exportUserLists = () => {
	misskeyApi('i/export-user-lists', {}).then(onExportSuccess).catch(onError);
};

const exportMuting = () => {
	misskeyApi('i/export-mute', {}).then(onExportSuccess).catch(onError);
};

const exportAntennas = () => {
	misskeyApi('i/export-antennas', {}).then(onExportSuccess).catch(onError);
};

const importFollowing = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	misskeyApi('i/import-following', {
		fileId: file.id,
		withReplies: withReplies.value,
	}).then(onImportSuccess).catch(onError);
};

const importUserLists = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	misskeyApi('i/import-user-lists', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importMuting = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	misskeyApi('i/import-muting', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importBlocking = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	misskeyApi('i/import-blocking', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importAntennas = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	misskeyApi('i/import-antennas', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.importAndExport,
	icon: 'ti ti-package',
}));
</script>

<style module>
.button {
	margin-right: 16px;
}
</style>
