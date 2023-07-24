<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps_m">
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
			<section v-for="announcement in announcements" class="">
				<div class="_panel _gaps_m" style="padding: 24px;">
					<MkInput ref="announceTitleEl" v-model="announcement.title" :large="false">
						<template #label>{{ i18n.ts.title }}&nbsp;<button v-tooltip="i18n.ts.emoji" :class="['_button']" @click="insertEmoji"><i class="ti ti-mood-happy"></i></button></template>
					</MkInput>
					<MkTextarea v-model="announcement.text">
						<template #label>{{ i18n.ts.text }}</template>
					</MkTextarea>
					<MkInput v-model="announcement.imageUrl">
						<template #label>{{ i18n.ts.imageUrl }}</template>
					</MkInput>
					<MkInput v-model="announcement.closeDuration" type="number">
						<template #label>{{ i18n.ts.dialogCloseDuration }}</template>
						<template #suffix>{{ i18n.ts._time.second }}</template>
					</MkInput>
					<p v-if="announcement.reads">{{ i18n.t('nUsersRead', { n: announcement.reads }) }}</p>
					<MkUserCardMini v-if="announcement.userId" :user="announcement.user" @click="editUser(announcement)"></MkUserCardMini>
					<MkButton v-else class="button" inline primary @click="editUser(announcement)">{{ i18n.ts.specifyUser }}</MkButton>
					<div class="buttons _buttons">
						<MkButton class="button" inline primary @click="save(announcement)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton class="button" inline danger @click="remove(announcement)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
					</div>
				</div>
			</section>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { UserLite } from 'misskey-js/built/entities';
import XHeader from './_header_.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let announcements: any[] = $ref([]);

const user = ref<UserLite>(null);
const announceTitleEl = $shallowRef<HTMLInputElement | null>(null);

function selectUserFilter() {
	os.selectUser().then(_user => {
		user.value = _user;
	});
}

function editUser(an) {
	os.selectUser().then(_user => {
		an.userId = _user.id;
		an.user = _user;
	});
}

async function insertEmoji(ev: MouseEvent) {
	os.openEmojiPicker(ev.currentTarget ?? ev.target, {}, announceTitleEl);
}

os.api('admin/announcements/list').then(announcementResponse => {
	announcements = announcementResponse;
});

function add() {
	announcements.unshift({
		id: null,
		title: '',
		text: '',
		imageUrl: null,
		userId: null,
		user: null,
		closeDuration: 10,
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

function save(announcement) {
	if (announcement.id == null) {
		os.api('admin/announcements/create', announcement).then(() => {
			os.alert({
				type: 'success',
				text: i18n.ts.saved,
			});
			refresh();
		}).catch(err => {
			os.alert({
				type: 'error',
				text: err,
			});
		});
	} else {
		os.api('admin/announcements/update', announcement).then(() => {
			os.alert({
				type: 'success',
				text: i18n.ts.saved,
			});
		}).catch(err => {
			os.alert({
				type: 'error',
				text: err,
			});
		});
	}
}

function refresh() {
	os.api('admin/announcements/list', { userId: user.value?.id }).then(announcementResponse => {
		announcements = announcementResponse;
	});
}

watch(user, refresh);

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
