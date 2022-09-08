<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="900">
		<div class="ztgjmzrw">
			<section v-for="announcement in announcements" class="_card _gap announcements">
				<div class="_content announcement">
					<MkInput v-model="announcement.title">
						<template #label>{{ i18n.ts.title }}</template>
					</MkInput>
					<MkTextarea v-model="announcement.text">
						<template #label>{{ i18n.ts.text }}</template>
					</MkTextarea>
					<MkInput v-model="announcement.imageUrl">
						<template #label>{{ i18n.ts.imageUrl }}</template>
					</MkInput>
					<p v-if="announcement.reads">{{ i18n.t('nUsersRead', { n: announcement.reads }) }}</p>
					<div class="buttons">
						<MkButton class="button" inline primary @click="save(announcement)"><i class="fas fa-save"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton class="button" inline @click="remove(announcement)"><i class="fas fa-trash-alt"></i> {{ i18n.ts.remove }}</MkButton>
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
import MkInput from '@/components/form/input.vue';
import MkTextarea from '@/components/form/textarea.vue';
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

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'fas fa-plus',
	text: i18n.ts.add,
	handler: add,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.announcements,
	icon: 'fas fa-broadcast-tower',
});
</script>

<style lang="scss" scoped>
.ztgjmzrw {
	margin: var(--margin);
}
</style>
