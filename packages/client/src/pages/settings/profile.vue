<template>
<div class="_formRoot">
	<div class="llvierxe" :style="{ backgroundImage: $i.bannerUrl ? `url(${ $i.bannerUrl })` : null }">
		<div class="avatar">
			<MkAvatar class="avatar" :user="$i" :disable-link="true" @click="changeAvatar"/>
			<MkButton primary rounded class="avatarEdit" @click="changeAvatar">{{ i18n.ts._profile.changeAvatar }}</MkButton>
		</div>
		<MkButton primary rounded class="bannerEdit" @click="changeBanner">{{ i18n.ts._profile.changeBanner }}</MkButton>
	</div>

	<FormInput v-model="profile.name" :max="30" manual-save class="_formBlock">
		<template #label>{{ i18n.ts._profile.name }}</template>
	</FormInput>

	<FormTextarea v-model="profile.description" :max="500" tall manual-save class="_formBlock">
		<template #label>{{ i18n.ts._profile.description }}</template>
		<template #caption>{{ i18n.ts._profile.youCanIncludeHashtags }}</template>
	</FormTextarea>

	<FormInput v-model="profile.location" manual-save class="_formBlock">
		<template #label>{{ i18n.ts.location }}</template>
		<template #prefix><i class="ti ti-map-pin"></i></template>
	</FormInput>

	<FormInput v-model="profile.birthday" type="date" manual-save class="_formBlock">
		<template #label>{{ i18n.ts.birthday }}</template>
		<template #prefix><i class="ti ti-cake"></i></template>
	</FormInput>

	<FormSelect v-model="profile.lang" class="_formBlock">
		<template #label>{{ i18n.ts.language }}</template>
		<option v-for="x in Object.keys(langmap)" :key="x" :value="x">{{ langmap[x].nativeName }}</option>
	</FormSelect>

	<FormSlot class="_formBlock">
		<FormFolder>
			<template #icon><i class="ti ti-list"></i></template>
			<template #label>{{ i18n.ts._profile.metadataEdit }}</template>

			<div class="_formRoot">
				<FormSplit v-for="(record, i) in fields" :min-width="250" class="_formBlock">
					<FormInput v-model="record.name" small>
						<template #label>{{ i18n.ts._profile.metadataLabel }} #{{ i + 1 }}</template>
					</FormInput>
					<FormInput v-model="record.value" small>
						<template #label>{{ i18n.ts._profile.metadataContent }} #{{ i + 1 }}</template>
					</FormInput>
				</FormSplit>
				<MkButton :disabled="fields.length >= 16" inline style="margin-right: 8px;" @click="addField"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
				<MkButton inline primary @click="saveFields"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
			</div>
		</FormFolder>
		<template #caption>{{ i18n.ts._profile.metadataDescription }}</template>
	</FormSlot>

	<FormSwitch v-model="profile.isCat" class="_formBlock">{{ i18n.ts.flagAsCat }}<template #caption>{{ i18n.ts.flagAsCatDescription }}</template></FormSwitch>
	<FormSwitch v-model="profile.showTimelineReplies" class="_formBlock">{{ i18n.ts.flagShowTimelineReplies }}<template #caption>{{ i18n.ts.flagShowTimelineRepliesDescription }} {{ i18n.ts.reflectMayTakeTime }}</template></FormSwitch>
	<FormSwitch v-model="profile.isBot" class="_formBlock">{{ i18n.ts.flagAsBot }}<template #caption>{{ i18n.ts.flagAsBotDescription }}</template></FormSwitch>
</div>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import FormInput from '@/components/form/input.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormSplit from '@/components/form/split.vue';
import FormFolder from '@/components/form/folder.vue';
import FormSlot from '@/components/form/slot.vue';
import { host } from '@/config';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { langmap } from '@/scripts/langmap';
import { definePageMetadata } from '@/scripts/page-metadata';

const profile = reactive({
	name: $i.name,
	description: $i.description,
	location: $i.location,
	birthday: $i.birthday,
	lang: $i.lang,
	isBot: $i.isBot,
	isCat: $i.isCat,
	showTimelineReplies: $i.showTimelineReplies,
});

watch(() => profile, () => {
	save();
}, {
	deep: true,
});

const fields = reactive($i.fields.map(field => ({ name: field.name, value: field.value })));

function addField() {
	fields.push({
		name: '',
		value: '',
	});
}

while (fields.length < 4) {
	addField();
}

function saveFields() {
	os.apiWithDialog('i/update', {
		fields: fields.filter(field => field.name !== '' && field.value !== ''),
	});
}

function save() {
	os.apiWithDialog('i/update', {
		name: profile.name || null,
		description: profile.description || null,
		location: profile.location || null,
		birthday: profile.birthday || null,
		lang: profile.lang || null,
		isBot: !!profile.isBot,
		isCat: !!profile.isCat,
		showTimelineReplies: !!profile.showTimelineReplies,
	});
}

function changeAvatar(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.avatar).then(async (file) => {
		let originalOrCropped = file;

		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.t('cropImageAsk'),
		});

		if (!canceled) {
			originalOrCropped = await os.cropImage(file, {
				aspectRatio: 1,
			});
		}

		const i = await os.apiWithDialog('i/update', {
			avatarId: originalOrCropped.id,
		});
		$i.avatarId = i.avatarId;
		$i.avatarUrl = i.avatarUrl;
	});
}

function changeBanner(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.banner).then(async (file) => {
		let originalOrCropped = file;

		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.t('cropImageAsk'),
		});

		if (!canceled) {
			originalOrCropped = await os.cropImage(file, {
				aspectRatio: 2,
			});
		}

		const i = await os.apiWithDialog('i/update', {
			bannerId: originalOrCropped.id,
		});
		$i.bannerId = i.bannerId;
		$i.bannerUrl = i.bannerUrl;
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.profile,
	icon: 'ti ti-user',
});
</script>

<style lang="scss" scoped>
.llvierxe {
	position: relative;
	background-size: cover;
	background-position: center;
	border: solid 1px var(--divider);
	border-radius: 10px;
	overflow: clip;

	> .avatar {
		display: inline-block;
		text-align: center;
		padding: 16px;

		> .avatar {
			display: inline-block;
			width: 72px;
			height: 72px;
			margin: 0 auto 16px auto;
		}
	}

	> .bannerEdit {
		position: absolute;
		top: 16px;
		right: 16px;
	}
}
</style>
