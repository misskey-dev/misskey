<template>
<div class="_formRoot">
	<FormSwitch v-model="isLocked" class="_formBlock" @update:modelValue="save()">{{ $ts.makeFollowManuallyApprove }}<template #caption>{{ $ts.lockedAccountInfo }}</template></FormSwitch>
	<FormSwitch v-if="isLocked" v-model="autoAcceptFollowed" class="_formBlock" @update:modelValue="save()">{{ $ts.autoAcceptFollowed }}</FormSwitch>

	<FormSwitch v-model="publicReactions" class="_formBlock" @update:modelValue="save()">
		{{ $ts.makeReactionsPublic }}
		<template #caption>{{ $ts.makeReactionsPublicDescription }}</template>
	</FormSwitch>
		
	<FormSelect v-model="ffVisibility" class="_formBlock" @update:modelValue="save()">
		<template #label>{{ $ts.ffVisibility }}</template>
		<option value="public">{{ $ts._ffVisibility.public }}</option>
		<option value="followers">{{ $ts._ffVisibility.followers }}</option>
		<option value="private">{{ $ts._ffVisibility.private }}</option>
		<template #caption>{{ $ts.ffVisibilityDescription }}</template>
	</FormSelect>
		
	<FormSwitch v-model="hideOnlineStatus" class="_formBlock" @update:modelValue="save()">
		{{ $ts.hideOnlineStatus }}
		<template #caption>{{ $ts.hideOnlineStatusDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model="noCrawle" class="_formBlock" @update:modelValue="save()">
		{{ $ts.noCrawle }}
		<template #caption>{{ $ts.noCrawleDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model="isExplorable" class="_formBlock" @update:modelValue="save()">
		{{ $ts.makeExplorable }}
		<template #caption>{{ $ts.makeExplorableDescription }}</template>
	</FormSwitch>

	<FormSection>
		<FormSwitch v-model="rememberNoteVisibility" class="_formBlock" @update:modelValue="save()">{{ $ts.rememberNoteVisibility }}</FormSwitch>
		<FormGroup v-if="!rememberNoteVisibility" class="_formBlock">
			<template #label>{{ $ts.defaultNoteVisibility }}</template>
			<FormSelect v-model="defaultNoteVisibility" class="_formBlock">
				<option value="public">{{ $ts._visibility.public }}</option>
				<option value="home">{{ $ts._visibility.home }}</option>
				<option value="followers">{{ $ts._visibility.followers }}</option>
				<option value="specified">{{ $ts._visibility.specified }}</option>
			</FormSelect>
			<FormSwitch v-model="defaultNoteLocalOnly" class="_formBlock">{{ $ts._visibility.localOnly }}</FormSwitch>
		</FormGroup>
	</FormSection>

	<FormSwitch v-model="keepCw" class="_formBlock" @update:modelValue="save()">{{ $ts.keepCw }}</FormSwitch>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormSection from '@/components/form/section.vue';
import FormGroup from '@/components/form/group.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';
import { $i } from '@/account';

let isLocked = $ref($i.isLocked);
let autoAcceptFollowed = $ref($i.autoAcceptFollowed);
let noCrawle = $ref($i.noCrawle);
let isExplorable = $ref($i.isExplorable);
let hideOnlineStatus = $ref($i.hideOnlineStatus);
let publicReactions = $ref($i.publicReactions);
let ffVisibility = $ref($i.ffVisibility);

let defaultNoteVisibility = $computed(defaultStore.makeGetterSetter('defaultNoteVisibility'));
let defaultNoteLocalOnly = $computed(defaultStore.makeGetterSetter('defaultNoteLocalOnly'));
let rememberNoteVisibility = $computed(defaultStore.makeGetterSetter('rememberNoteVisibility'));
let keepCw = $computed(defaultStore.makeGetterSetter('keepCw'));

function save() {
	os.api('i/update', {
		isLocked: !!isLocked,
		autoAcceptFollowed: !!autoAcceptFollowed,
		noCrawle: !!noCrawle,
		isExplorable: !!isExplorable,
		hideOnlineStatus: !!hideOnlineStatus,
		publicReactions: !!publicReactions,
		ffVisibility: ffVisibility,
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.privacy,
		icon: 'fas fa-lock-open',
		bg: 'var(--bg)',
	},
});
</script>
