<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps_m">
			<section v-for="announcement in announcements" class="">
				<div class="_panel _gaps_m" style="padding: 24px;">
					<MkInput v-model="announcement.title">
						<template #label>{{ i18n.ts.title }}</template>
					</MkInput>
					<MkTextarea v-model="announcement.text">
						<template #label>{{ i18n.ts.text }}</template>
					</MkTextarea>
					<MkInput v-model="announcement.imageUrl">
						<template #label>{{ i18n.ts.imageUrl }}</template>
					</MkInput>
					<MkRadios v-model="announcement.icon">
						<template #label>{{ i18n.ts.icon }}</template>
						<option value="info"><i class="ti ti-info-circle"></i></option>
						<option value="warning"><i class="ti ti-alert-triangle" style="color: var(--warn);"></i></option>
						<option value="error"><i class="ti ti-circle-x" style="color: var(--error);"></i></option>
						<option value="success"><i class="ti ti-check" style="color: var(--success);"></i></option>
					</MkRadios>
					<MkRadios v-model="announcement.display">
						<template #label>{{ i18n.ts.display }}</template>
						<option value="normal">{{ i18n.ts.normal }}</option>
						<option value="banner">{{ i18n.ts.banner }}</option>
						<option value="dialog">{{ i18n.ts.dialog }}</option>
					</MkRadios>
					<MkSwitch v-model="announcement.forExistingUsers">
						{{ i18n.ts._announcement.forExistingUsers }}
						<template #caption>{{ i18n.ts._announcement.forExistingUsersDescription }}</template>
					</MkSwitch>
					<MkSwitch v-model="announcement.needConfirmationToRead">
						{{ i18n.ts._announcement.needConfirmationToRead }}
						<template #caption>{{ i18n.ts._announcement.needConfirmationToReadDescription }}</template>
					</MkSwitch>
					<p v-if="announcement.reads">{{ i18n.t('nUsersRead', { n: announcement.reads }) }}</p>
					<div class="buttons _buttons">
						<MkButton class="button" inline primary @click="save(announcement)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton v-if="announcement.id != null" class="button" inline @click="deactivate(announcement)"><i class="ti ti-trash"></i> {{ i18n.ts._announcement.deactivate }}</MkButton>
						<MkButton v-if="announcement.id != null" class="button" inline danger @click="remove(announcement)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
					</div>
				</div>
			</section>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XHeader from './_header_.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRadios from '@/components/MkRadios.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let announcements: any[] = $ref([]);

os.api('admin/announcements/list').then(announcementResponse => {
	announcements = announcementResponse;
});

function add() {
	announcements.unshift({
		id: null,
		title: '',
		text: '',
		imageUrl: null,
		icon: 'info',
		display: 'normal',
		forExistingUsers: false,
		needConfirmationToRead: false,
	});
}

function remove(announcement) {
	os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: announcement.title }),
	}).then(({ canceled }) => {
		if (canceled) return;
		announcements = announcements.filter(x => x !== announcement);
		os.api('admin/announcements/delete', announcement);
	});
}

async function deactivate(announcement) {
	await os.apiWithDialog('admin/announcements/update', {
		...announcement,
		isActive: false,
	});
	refresh();
}

async function save(announcement) {
	if (announcement.id == null) {
		await os.apiWithDialog('admin/announcements/create', announcement);
		refresh();
	} else {
		os.apiWithDialog('admin/announcements/update', announcement);
	}
}

function refresh() {
	os.api('admin/announcements/list').then(announcementResponse => {
		announcements = announcementResponse;
	});
}

refresh();

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: add,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.announcements,
	icon: 'ti ti-speakerphone',
});
</script>
