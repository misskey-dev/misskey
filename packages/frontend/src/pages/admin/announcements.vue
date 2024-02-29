<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<MkInfo>{{ i18n.ts._announcement.shouldNotBeUsedToPresentPermanentInfo }}</MkInfo>
			<MkInfo v-if="announcements.length > 5" warn>{{ i18n.ts._announcement.tooManyActiveAnnouncementDescription }}</MkInfo>

			<MkFolder v-for="announcement in announcements" :key="announcement.id ?? announcement._id" :defaultOpen="announcement.id == null">
				<template #label>{{ announcement.title }}</template>
				<template #icon>
					<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
					<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--warn);"></i>
					<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--error);"></i>
					<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--success);"></i>
				</template>
				<template #caption>{{ announcement.text }}</template>

				<div class="_gaps_m">
					<MkInput v-model="announcement.title">
						<template #label>{{ i18n.ts.title }}</template>
					</MkInput>
					<MkTextarea v-model="announcement.text" mfmAutocomplete :mfmPreview="true">
						<template #label>{{ i18n.ts.text }}</template>
					</MkTextarea>
					<MkInput v-model="announcement.imageUrl" type="url">
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
					<MkInfo v-if="announcement.display === 'dialog'" warn>{{ i18n.ts._announcement.dialogAnnouncementUxWarn }}</MkInfo>
					<MkSwitch v-model="announcement.forExistingUsers" :helpText="i18n.ts._announcement.forExistingUsersDescription">
						{{ i18n.ts._announcement.forExistingUsers }}
					</MkSwitch>
					<MkSwitch v-model="announcement.silence" :helpText="i18n.ts._announcement.silenceDescription">
						{{ i18n.ts._announcement.silence }}
					</MkSwitch>
					<MkSwitch v-model="announcement.needConfirmationToRead" :helpText="i18n.ts._announcement.needConfirmationToReadDescription">
						{{ i18n.ts._announcement.needConfirmationToRead }}
					</MkSwitch>
					<p v-if="announcement.reads">{{ i18n.tsx.nUsersRead({ n: announcement.reads }) }}</p>
					<div class="buttons _buttons">
						<MkButton class="button" inline primary @click="save(announcement)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton v-if="announcement.id != null" class="button" inline @click="archive(announcement)"><i class="ti ti-check"></i> {{ i18n.ts._announcement.end }} ({{ i18n.ts.archive }})</MkButton>
						<MkButton v-if="announcement.id != null" class="button" inline danger @click="del(announcement)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
					</div>
				</div>
			</MkFolder>
			<MkButton class="button" @click="more()">
				<i class="ti ti-reload"></i>{{ i18n.ts.more }}
			</MkButton>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XHeader from './_header_.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkFolder from '@/components/MkFolder.vue';
import MkTextarea from '@/components/MkTextarea.vue';

const announcements = ref<any[]>([]);

misskeyApi('admin/announcements/list').then(announcementResponse => {
	announcements.value = announcementResponse;
});

function add() {
	announcements.value.unshift({
		_id: Math.random().toString(36),
		id: null,
		title: 'New announcement',
		text: '',
		imageUrl: null,
		icon: 'info',
		display: 'normal',
		forExistingUsers: false,
		silence: false,
		needConfirmationToRead: false,
	});
}

function del(announcement) {
	os.confirm({
		type: 'warning',
		text: i18n.tsx.deleteAreYouSure({ x: announcement.title }),
	}).then(({ canceled }) => {
		if (canceled) return;
		announcements.value = announcements.value.filter(x => x !== announcement);
		misskeyApi('admin/announcements/delete', announcement);
	});
}

async function archive(announcement) {
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

function more() {
	misskeyApi('admin/announcements/list', { untilId: announcements.value.reduce((acc, announcement) => announcement.id != null ? announcement : acc).id }).then(announcementResponse => {
		announcements.value = announcements.value.concat(announcementResponse);
	});
}

function refresh() {
	misskeyApi('admin/announcements/list').then(announcementResponse => {
		announcements.value = announcementResponse;
	});
}

refresh();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: add,
}]);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.announcements,
	icon: 'ti ti-speakerphone',
}));
</script>
