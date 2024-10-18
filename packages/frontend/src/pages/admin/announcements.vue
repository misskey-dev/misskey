<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<MkFolder>
				<template #label>{{ i18n.ts.options }}</template>

				<MkFolder>
					<template #label>{{ i18n.ts.specifyUser }}</template>
					<template v-if="user" #suffix>@{{ user.username }}</template>

					<div style="text-align: center;" class="_gaps">
						<div v-if="user">@{{ user.username }}</div>
						<div>
							<MkButton v-if="user == null" primary rounded inline @click="selectUserFilter">{{ i18n.ts.selectUser }}</MkButton>
							<MkButton v-else danger rounded inline @click="user = null">{{ i18n.ts.remove }}</MkButton>
						</div>
					</div>
				</MkFolder>
			</MkFolder>

			<MkFolder v-for="announcement in announcements" :key="announcement.id ?? announcement._id" :defaultOpen="announcement.id == null">
				<template #label>{{ announcement.title }}</template>
				<template #icon>
					<i v-if="announcement.id && !announcement.isActive" class="ti ti-archive"></i>
					<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
					<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--warn);"></i>
					<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--error);"></i>
					<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--success);"></i>
				</template>
				<template #caption>{{ announcement.text }}</template>

				<div class="_gaps_m">
					<MkInput ref="announceTitleEl" v-model="announcement.title" :large="false">
						<template #label>{{ i18n.ts.title }}&nbsp;<button v-tooltip="i18n.ts.emoji" :class="['_button']" @click="insertEmoji"><i class="ti ti-mood-happy"></i></button></template>
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
					<MkSwitch v-model="announcement.needConfirmationToRead" :helpText="i18n.ts._announcement.needConfirmationToReadDescription">
						{{ i18n.ts._announcement.needConfirmationToRead }}
					</MkSwitch>
					<MkSwitch v-model="announcement.needEnrollmentTutorialToRead" :helpText="i18n.ts._announcement.needEnrollmentTutorialToReadDescription">
						{{ i18n.ts._announcement.needEnrollmentTutorialToRead }}
					</MkSwitch>
					<MkInput v-model="announcement.closeDuration" type="number">
						<template #label>{{ i18n.ts.dialogCloseDuration }}</template>
						<template #suffix>{{ i18n.ts._time.second }}</template>
					</MkInput>
					<MkInput v-model="announcement.displayOrder" type="number">
						<template #label>{{ i18n.ts.displayOrder }}</template>
					</MkInput>
					<MkSwitch v-model="announcement.silence" :helpText="i18n.ts._announcement.silenceDescription">
						{{ i18n.ts._announcement.silence }}
					</MkSwitch>
					<p v-if="announcement.reads">{{ i18n.tsx.nUsersRead({ n: announcement.reads }) }} <span v-if="announcement.lastReadAt">(<MkTime :time="announcement.lastReadAt" mode="absolute"/>)</span></p>
					<MkUserCardMini v-if="announcement.userId" :user="announcement.user" @click="editUser(announcement)"></MkUserCardMini>
					<MkButton v-else class="button" inline primary @click="editUser(announcement)">{{ i18n.ts.specifyUser }}</MkButton>
					<div class="buttons _buttons">
						<MkButton v-if="announcement.id == null || announcement.isActive" class="button" inline primary @click="save(announcement)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton v-if="announcement.id != null && announcement.isActive" class="button" inline @click="archive(announcement)"><i class="ti ti-check"></i> {{ i18n.ts._announcement.end }} ({{ i18n.ts.archive }})</MkButton>
						<MkButton v-if="announcement.id != null" class="button" inline danger @click="del(announcement)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
					</div>
				</div>
			</MkFolder>
			<MkButton v-if="hasMore" :class="$style.more" :disabled="!hasMore" primary rounded @click="fetch()">
				<i class="ti ti-reload"></i>{{ i18n.ts.more }}
			</MkButton>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, shallowRef, watch, computed } from 'vue';
import * as misskey from 'misskey-js';
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
import MkUserCardMini from '@/components/MkUserCardMini.vue';

const announceTitleEl = shallowRef<HTMLInputElement | null>(null);
const user = ref<misskey.entities.UserLite | null>(null);
const offset = ref(0);
const hasMore = ref(false);
import MkTextarea from '@/components/MkTextarea.vue';

const announcements = ref<any[]>([]);

function selectUserFilter(): void {
	os.selectUser().then(_user => {
		user.value = _user;
	});
}

function editUser(announcement): void {
	os.selectUser().then(_user => {
		announcement.userId = _user.id;
		announcement.user = _user;
	});
}

function insertEmoji(ev: MouseEvent): void {
	os.openEmojiPicker(
		(ev.currentTarget ?? ev.target) as HTMLElement,
		{ asReactionPicker: false },
		announceTitleEl.value
	);
}

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
		needConfirmationToRead: false,
		closeDuration: 0,
		displayOrder: 0,
		silence: false,
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
	fetch(true);
}

async function save(announcement): Promise<void> {
	if (announcement.id == null) {
		await os.apiWithDialog('admin/announcements/create', announcement);
	} else {
		await os.apiWithDialog('admin/announcements/update', announcement);
	}
	fetch(true);
}

function fetch(resetOffset = false): void {
	if (resetOffset) {
		announcements.value = [];
		offset.value = 0;
	}

	misskeyApi('admin/announcements/list', {
		offsetMode: true,
		offset: offset.value,
		limit: 10,
		userId: user.value?.id,
	}).then(announcementResponse => {
		announcements.value = announcements.value.concat(announcementResponse);
		hasMore.value = announcementResponse?.length === 10;
		offset.value += announcementResponse?.length ?? 0;
	});
}

watch(user, () => fetch(true));
fetch(true);

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

<style lang="scss" module>
.more {
	margin-left: auto;
	margin-right: auto;
}
</style>
