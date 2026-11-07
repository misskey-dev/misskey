<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/profiles" :label="i18n.ts._preferencesProfile.manageProfiles" :keywords="['profile', 'settings', 'preferences', 'manage']" icon="ti ti-settings-cog">
	<div class="_gaps">
		<MkFolder v-for="backup in backups">
			<template #label>{{ backup.name }}</template>
			<MkButton danger @click="del(backup)">{{ i18n.ts.delete }}</MkButton>
		</MkFolder>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { deleteCloudBackup, listCloudBackups } from '@/preferences/utility.js';

const backups = await listCloudBackups();

function del(backup: { name: string }): void {
	deleteCloudBackup(backup.name);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts._preferencesProfile.manageProfiles,
	icon: 'ti ti-settings-cog',
}));
</script>

<style lang="scss" module>
</style>
