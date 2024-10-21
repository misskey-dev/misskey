<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSwitch v-model="isLocked" @update:modelValue="save()">{{ i18n.ts.makeFollowManuallyApprove }}<template #caption>{{ i18n.ts.lockedAccountInfo }}</template></MkSwitch>
	<MkSwitch v-if="isLocked" v-model="autoAcceptFollowed" @update:modelValue="save()">{{ i18n.ts.autoAcceptFollowed }}</MkSwitch>

	<MkSwitch v-model="publicReactions" @update:modelValue="save()">
		{{ i18n.ts.makeReactionsPublic }}
		<template #caption>{{ i18n.ts.makeReactionsPublicDescription }}</template>
	</MkSwitch>

	<MkSelect v-model="followingVisibility" @update:modelValue="save()">
		<template #label>{{ i18n.ts.followingVisibility }}</template>
		<option value="public">{{ i18n.ts._ffVisibility.public }}</option>
		<option value="followers">{{ i18n.ts._ffVisibility.followers }}</option>
		<option value="private">{{ i18n.ts._ffVisibility.private }}</option>
	</MkSelect>

	<MkSelect v-model="followersVisibility" @update:modelValue="save()">
		<template #label>{{ i18n.ts.followersVisibility }}</template>
		<option value="public">{{ i18n.ts._ffVisibility.public }}</option>
		<option value="followers">{{ i18n.ts._ffVisibility.followers }}</option>
		<option value="private">{{ i18n.ts._ffVisibility.private }}</option>
	</MkSelect>

	<MkSwitch v-model="hideOnlineStatus" @update:modelValue="save()">
		{{ i18n.ts.hideOnlineStatus }}
		<template #caption>{{ i18n.ts.hideOnlineStatusDescription }}</template>
	</MkSwitch>
	<MkSwitch v-model="noCrawle" @update:modelValue="save()">
		{{ i18n.ts.noCrawle }}
		<template #caption>{{ i18n.ts.noCrawleDescription }}</template>
	</MkSwitch>
	<MkSwitch v-model="preventAiLearning" @update:modelValue="save()">
		{{ i18n.ts.preventAiLearning }}
		<template #caption>{{ i18n.ts.preventAiLearningDescription }}</template>
	</MkSwitch>
	<MkSwitch v-model="isExplorable" @update:modelValue="save()">
		{{ i18n.ts.makeExplorable }}
		<template #caption>{{ i18n.ts.makeExplorableDescription }}</template>
	</MkSwitch>

	<FormSection>
		<template #label>{{ i18n.ts.lockdown }}<span class="_beta">{{ i18n.ts.beta }}</span></template>

		<div class="_gaps_m">
			<MkSwitch v-model="requireSigninToViewContents" @update:modelValue="save()">
				{{ i18n.ts._accountSettings.requireSigninToViewContents }}
				<template #caption>
					<div>{{ i18n.ts._accountSettings.requireSigninToViewContentsDescription1 }}</div>
					<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._accountSettings.requireSigninToViewContentsDescription2 }}</div>
					<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._accountSettings.requireSigninToViewContentsDescription3 }}</div>
				</template>
			</MkSwitch>

			<FormSlot>
				<template #label>{{ i18n.ts._accountSettings.makeNotesFollowersOnlyBefore }}</template>

				<div class="_gaps_s">
					<MkSelect :modelValue="makeNotesFollowersOnlyBefore_type" @update:modelValue="makeNotesFollowersOnlyBefore = $event === 'relative' ? -604800 : null">
						<option :value="null">{{ i18n.ts.none }}</option>
						<option value="relative">{{ i18n.ts._accountSettings.notesHavePassedSpecifiedPeriod }}</option>
						<option value="absolute">{{ i18n.ts._accountSettings.notesOlderThanSpecifiedDateAndTime }}</option>
					</MkSelect>

					<MkSelect v-if="makeNotesFollowersOnlyBefore_type === 'relative'" v-model="makeNotesFollowersOnlyBefore" @update:modelValue="save()">
						<option :value="-3600">{{ '1h ago' }}</option>
						<option :value="-86400">{{ '1d ago' }}</option>
						<option :value="-259200">{{ '3d ago' }}</option>
						<option :value="-604800">{{ '1w ago' }}</option>
						<option :value="-2592000">{{ '1m ago' }}</option>
						<option :value="-31104000">{{ '1y ago' }}</option>
					</MkSelect>
				</div>

				<template #caption>
					<div>{{ i18n.ts._accountSettings.makeNotesFollowersOnlyBeforeDescription }}</div>
					<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._accountSettings.mayNotEffectForFederatedNotes }}</div>
				</template>
			</FormSlot>

			<MkSelect v-model="makeNotesHiddenBefore" @update:modelValue="save()">
				<template #label>{{ i18n.ts._accountSettings.makeNotesHiddenBefore }}</template>
				<option :value="null">{{ i18n.ts.none }}</option>
				<option :value="-3600">{{ '1h ago' }}</option>
				<option :value="-86400">{{ '1d ago' }}</option>
				<option :value="-259200">{{ '3d ago' }}</option>
				<option :value="-604800">{{ '1w ago' }}</option>
				<option :value="-2592000">{{ '1m ago' }}</option>
				<option :value="-31104000">{{ '1y ago' }}</option>
				<template #caption>
					<div>{{ i18n.ts._accountSettings.makeNotesHiddenBeforeDescription }}</div>
					<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._accountSettings.mayNotEffectForFederatedNotes }}</div>
				</template>
			</MkSelect>
		</div>
	</FormSection>

	<FormSection>
		<div class="_gaps_m">
			<MkSwitch v-model="rememberNoteVisibility" @update:modelValue="save()">{{ i18n.ts.rememberNoteVisibility }}</MkSwitch>
			<MkFolder v-if="!rememberNoteVisibility">
				<template #label>{{ i18n.ts.defaultNoteVisibility }}</template>
				<template v-if="defaultNoteVisibility === 'public'" #suffix>{{ i18n.ts._visibility.public }}</template>
				<template v-else-if="defaultNoteVisibility === 'home'" #suffix>{{ i18n.ts._visibility.home }}</template>
				<template v-else-if="defaultNoteVisibility === 'followers'" #suffix>{{ i18n.ts._visibility.followers }}</template>
				<template v-else-if="defaultNoteVisibility === 'specified'" #suffix>{{ i18n.ts._visibility.specified }}</template>

				<div class="_gaps_m">
					<MkSelect v-model="defaultNoteVisibility">
						<option value="public">{{ i18n.ts._visibility.public }}</option>
						<option value="home">{{ i18n.ts._visibility.home }}</option>
						<option value="followers">{{ i18n.ts._visibility.followers }}</option>
						<option value="specified">{{ i18n.ts._visibility.specified }}</option>
					</MkSelect>
					<MkSwitch v-model="defaultNoteLocalOnly">{{ i18n.ts._visibility.disableFederation }}</MkSwitch>
				</div>
			</MkFolder>
		</div>
	</FormSection>

	<MkSwitch v-model="keepCw" @update:modelValue="save()">{{ i18n.ts.keepCw }}</MkSwitch>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { signinRequired } from '@/account.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import FormSlot from '@/components/form/slot.vue';

const $i = signinRequired();

const isLocked = ref($i.isLocked);
const autoAcceptFollowed = ref($i.autoAcceptFollowed);
const noCrawle = ref($i.noCrawle);
const preventAiLearning = ref($i.preventAiLearning);
const isExplorable = ref($i.isExplorable);
const requireSigninToViewContents = ref($i.requireSigninToViewContents ?? false);
const makeNotesFollowersOnlyBefore = ref($i.makeNotesFollowersOnlyBefore ?? null);
const makeNotesHiddenBefore = ref($i.makeNotesHiddenBefore ?? null);
const hideOnlineStatus = ref($i.hideOnlineStatus);
const publicReactions = ref($i.publicReactions);
const followingVisibility = ref($i.followingVisibility);
const followersVisibility = ref($i.followersVisibility);

const defaultNoteVisibility = computed(defaultStore.makeGetterSetter('defaultNoteVisibility'));
const defaultNoteLocalOnly = computed(defaultStore.makeGetterSetter('defaultNoteLocalOnly'));
const rememberNoteVisibility = computed(defaultStore.makeGetterSetter('rememberNoteVisibility'));
const keepCw = computed(defaultStore.makeGetterSetter('keepCw'));

const makeNotesFollowersOnlyBefore_type = computed(() => {
	if (makeNotesFollowersOnlyBefore.value === null) {
		return null;
	} else if (makeNotesFollowersOnlyBefore.value >= 0) {
		return 'absolute';
	} else {
		return 'relative';
	}
});

const makeNotesHiddenBefore_type = computed(() => {
	if (makeNotesHiddenBefore.value === null) {
		return null;
	} else if (makeNotesHiddenBefore.value >= 0) {
		return 'absolute';
	} else {
		return 'relative';
	}
});

function save() {
	misskeyApi('i/update', {
		isLocked: !!isLocked.value,
		autoAcceptFollowed: !!autoAcceptFollowed.value,
		noCrawle: !!noCrawle.value,
		preventAiLearning: !!preventAiLearning.value,
		isExplorable: !!isExplorable.value,
		requireSigninToViewContents: !!requireSigninToViewContents.value,
		makeNotesFollowersOnlyBefore: makeNotesFollowersOnlyBefore.value,
		makeNotesHiddenBefore: makeNotesHiddenBefore.value,
		hideOnlineStatus: !!hideOnlineStatus.value,
		publicReactions: !!publicReactions.value,
		followingVisibility: followingVisibility.value,
		followersVisibility: followersVisibility.value,
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.privacy,
	icon: 'ti ti-lock-open',
}));
</script>
