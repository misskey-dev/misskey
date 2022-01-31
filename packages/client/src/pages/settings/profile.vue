<template>
<div class="_formRoot">
	<div class="llvierxe" :style="{ backgroundImage: $i.bannerUrl ? `url(${ $i.bannerUrl })` : null }">
		<div class="avatar _acrylic">
			<MkAvatar class="avatar" :user="$i" :disable-link="true" @click="changeAvatar"/>
			<MkButton primary class="avatarEdit" @click="changeAvatar">{{ i18n.ts._profile.changeAvatar }}</MkButton>
		</div>
		<MkButton primary class="bannerEdit" @click="changeBanner">{{ i18n.ts._profile.changeBanner }}</MkButton>
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
		<template #prefix><i class="fas fa-map-marker-alt"></i></template>
	</FormInput>

	<FormInput v-model="profile.birthday" type="date" manual-save class="_formBlock">
		<template #label>{{ i18n.ts.birthday }}</template>
		<template #prefix><i class="fas fa-birthday-cake"></i></template>
	</FormInput>

	<FormSelect v-model="profile.lang" class="_formBlock">
		<template #label>{{ i18n.ts.language }}</template>
		<option v-for="x in langs" :key="x[0]" :value="x[0]">{{ x[1] }}</option>
	</FormSelect>

	<FormSlot>
		<MkButton @click="editMetadata">{{ i18n.ts._profile.metadataEdit }}</MkButton>
		<template #caption>{{ i18n.ts._profile.metadataDescription }}</template>
	</FormSlot>

	<FormSwitch v-model="profile.isCat" class="_formBlock">{{ i18n.ts.flagAsCat }}<template #caption>{{ i18n.ts.flagAsCatDescription }}</template></FormSwitch>
	<FormSwitch v-model="profile.showTimelineReplies" class="_formBlock">{{ i18n.ts.flagShowTimelineReplies }}<template #caption>{{ i18n.ts.flagShowTimelineRepliesDescription }}</template></FormSwitch>
	<FormSwitch v-model="profile.isBot" class="_formBlock">{{ i18n.ts.flagAsBot }}<template #caption>{{ i18n.ts.flagAsBotDescription }}</template></FormSwitch>

	<FormSwitch v-model="profile.alwaysMarkNsfw" class="_formBlock">{{ i18n.ts.alwaysMarkSensitive }}</FormSwitch>
</div>
</template>

<script lang="ts" setup>
import { defineComponent, reactive, watch } from 'vue';
import MkButton from '@/components/ui/button.vue';
import FormInput from '@/components/form/input.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormSlot from '@/components/form/slot.vue';
import { host, langs } from '@/config';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';
import { $i } from '@/account';

const profile = reactive({
	name: $i.name,
	description: $i.description,
	location: $i.location,
	birthday: $i.birthday,
	lang: $i.lang,
	isBot: $i.isBot,
	isCat: $i.isCat,
	showTimelineReplies: $i.showTimelineReplies,
	alwaysMarkNsfw: $i.alwaysMarkNsfw,
});

const additionalFields = reactive({
	fields: $i.fields,
});

watch(() => profile, () => {
	save();
}, {
	deep: true,
});

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
		alwaysMarkNsfw: !!profile.alwaysMarkNsfw,
	});
}

function changeAvatar(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.avatar).then(async (file) => {
		const i = await os.apiWithDialog('i/update', {
			avatarId: file.id,
		});
		$i.avatarId = i.avatarId;
		$i.avatarUrl = i.avatarUrl;
	});
}

function changeBanner(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.banner).then(async (file) => {
		const i = await os.apiWithDialog('i/update', {
			bannerId: file.id,
		});
		$i.bannerId = i.bannerId;
		$i.bannerUrl = i.bannerUrl;
	});
}

async function editMetadata() {
	const meta = await os.api('meta');
	let formData = {};
	for (let i = 0; i < meta.additionalFieldLimit; i++) {
		formData[`fieldName${i}`] = {
			type: 'string',
			label: i18n.ts._profile.metadataLabel + ` ${i+1}`,
			default: additionalFields.fields[i] ?? '',
		};
		formData[`fieldValue${i}`] = {
			type: 'string',
			label: i18n.ts._profile.metadataContent + ` ${i+1}`,
			default: additionalFields.fields[i] ?? '',
		};
	}
	const { canceled, result } = await os.form(i18n.ts._profile.metadata, formData);
	if (canceled) return;

	for (let i = 0; i < meta.additionalFieldLimit; i++) {
		additionalFields.fields[i] = {
			name: result[`fieldName${i}`],
			value: result[`fieldValue${i}`],
		};
	}

	os.api('i/update', {
		additionalFields.fields,
	}).then(i => {
		os.success();
	}).catch(err => {
		os.alert({
			type: 'error',
			text: err.id
		});
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.profile,
		icon: 'fas fa-user',
		bg: 'var(--bg)',
	},
});
</script>

<style lang="scss" scoped>
.llvierxe {
	position: relative;
	background-size: cover;
	background-position: center;
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
