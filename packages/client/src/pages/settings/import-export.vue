<template>
<div class="_formRoot">
	<FormSection>
		<template #label>{{ $ts._exportOrImport.allNotes }}</template>
		<MkButton :class="$style.button" inline @click="exportNotes()"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
	</FormSection>
	<FormSection>
		<template #label>{{ $ts._exportOrImport.followingList }}</template>
		<FormGroup>
			<FormSwitch v-model="excludeMutingUsers" class="_formBlock">
				{{ $ts._exportOrImport.excludeMutingUsers }}
			</FormSwitch>
			<FormSwitch v-model="excludeInactiveUsers" class="_formBlock">
				{{ $ts._exportOrImport.excludeInactiveUsers }}
			</FormSwitch>
			<MkButton :class="$style.button" inline @click="exportFollowing()"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
		</FormGroup>
		<FormGroup>
			<MkButton :class="$style.button" inline @click="importFollowing($event)"><i class="fas fa-upload"></i> {{ $ts.import }}</MkButton>
		</FormGroup>
	</FormSection>
	<FormSection>
		<template #label>{{ $ts._exportOrImport.userLists }}</template>
		<MkButton :class="$style.button" inline @click="exportUserLists()"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
		<MkButton :class="$style.button" inline @click="importUserLists($event)"><i class="fas fa-upload"></i> {{ $ts.import }}</MkButton>
	</FormSection>
	<FormSection>
		<template #label>{{ $ts._exportOrImport.muteList }}</template>
		<MkButton :class="$style.button" inline @click="exportMuting()"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
		<MkButton :class="$style.button" inline @click="importMuting($event)"><i class="fas fa-upload"></i> {{ $ts.import }}</MkButton>
	</FormSection>
	<FormSection>
		<template #label>{{ $ts._exportOrImport.blockingList }}</template>
		<MkButton :class="$style.button" inline @click="exportBlocking()"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
		<MkButton :class="$style.button" inline @click="importBlocking($event)"><i class="fas fa-upload"></i> {{ $ts.import }}</MkButton>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { defineExpose, ref } from 'vue';
import MkButton from '@/components/ui/button.vue';
import FormSection from '@/components/form/section.vue';
import FormGroup from '@/components/form/group.vue';
import FormSwitch from '@/components/form/switch.vue';
import * as os from '@/os';
import { selectFile } from '@/scripts/select-file';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const excludeMutingUsers = ref(false);
const excludeInactiveUsers = ref(false);

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
	os.api('i/export-notes', {}).then(onExportSuccess).catch(onError);
};

const exportFollowing = () => {
	os.api('i/export-following', {
		excludeMuting: excludeMutingUsers.value,
		excludeInactive: excludeInactiveUsers.value,
	})
	.then(onExportSuccess).catch(onError);
};

const exportBlocking = () => {
	os.api('i/export-blocking', {}).then(onExportSuccess).catch(onError);
};

const exportUserLists = () => {
	os.api('i/export-user-lists', {}).then(onExportSuccess).catch(onError);
};

const exportMuting = () => {
	os.api('i/export-mute', {}).then(onExportSuccess).catch(onError);
};

const importFollowing = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api('i/import-following', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importUserLists = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api('i/import-user-lists', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importMuting = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api('i/import-muting', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importBlocking = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api('i/import-blocking', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.importAndExport,
		icon: 'fas fa-boxes',
		bg: 'var(--bg)',
	}
});
</script>

<style module>
.button {
	margin-right: 16px;
}
</style>
