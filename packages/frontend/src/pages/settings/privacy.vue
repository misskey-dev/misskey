<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/privacy" :label="i18n.ts.privacy" :keywords="['privacy']" icon="ti ti-lock-open">
	<div class="_gaps_m">
		<SearchMarker :keywords="['follow', 'lock']">
			<MkSwitch v-model="isLocked" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.makeFollowManuallyApprove }}</SearchLabel></template>
				<template #caption><SearchKeyword>{{ i18n.ts.lockedAccountInfo }}</SearchKeyword></template>
			</MkSwitch>
		</SearchMarker>

		<MkDisableSection :disabled="!isLocked">
			<SearchMarker :keywords="['follow', 'auto', 'accept']">
				<MkSwitch v-model="autoAcceptFollowed" @update:modelValue="save()">
					<template #label><SearchLabel>{{ i18n.ts.autoAcceptFollowed }}</SearchLabel></template>
				</MkSwitch>
			</SearchMarker>
		</MkDisableSection>

		<SearchMarker :keywords="['reaction', 'public']">
			<MkSwitch v-model="publicReactions" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.makeReactionsPublic }}</SearchLabel></template>
				<template #caption><SearchKeyword>{{ i18n.ts.makeReactionsPublicDescription }}</SearchKeyword></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['following', 'visibility']">
			<MkSelect v-model="followingVisibility" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.followingVisibility }}</SearchLabel></template>
				<option value="public">{{ i18n.ts._ffVisibility.public }}</option>
				<option value="followers">{{ i18n.ts._ffVisibility.followers }}</option>
				<option value="private">{{ i18n.ts._ffVisibility.private }}</option>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['follower', 'visibility']">
			<MkSelect v-model="followersVisibility" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.followersVisibility }}</SearchLabel></template>
				<option value="public">{{ i18n.ts._ffVisibility.public }}</option>
				<option value="followers">{{ i18n.ts._ffVisibility.followers }}</option>
				<option value="private">{{ i18n.ts._ffVisibility.private }}</option>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['online', 'status']">
			<MkSwitch v-model="hideOnlineStatus" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.hideOnlineStatus }}</SearchLabel></template>
				<template #caption><SearchKeyword>{{ i18n.ts.hideOnlineStatusDescription }}</SearchKeyword></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['crawle', 'index', 'search']">
			<MkSwitch v-model="noCrawle" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.noCrawle }}</SearchLabel></template>
				<template #caption><SearchKeyword>{{ i18n.ts.noCrawleDescription }}</SearchKeyword></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['crawle', 'ai']">
			<MkSwitch v-model="preventAiLearning" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.preventAiLearning }}</SearchLabel></template>
				<template #caption><SearchKeyword>{{ i18n.ts.preventAiLearningDescription }}</SearchKeyword></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['explore']">
			<MkSwitch v-model="isExplorable" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.makeExplorable }}</SearchLabel></template>
				<template #caption><SearchKeyword>{{ i18n.ts.makeExplorableDescription }}</SearchKeyword></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['lockdown']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.lockdown }}</SearchLabel><span class="_beta">{{ i18n.ts.beta }}</span></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['login', 'signin']">
						<MkSwitch :modelValue="requireSigninToViewContents" @update:modelValue="update_requireSigninToViewContents">
							<template #label><SearchLabel>{{ i18n.ts._accountSettings.requireSigninToViewContents }}</SearchLabel></template>
							<template #caption>
								<div>{{ i18n.ts._accountSettings.requireSigninToViewContentsDescription1 }}</div>
								<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._accountSettings.requireSigninToViewContentsDescription2 }}</div>
								<div v-if="instance.federation !== 'none'"><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._accountSettings.requireSigninToViewContentsDescription3 }}</div>
							</template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['follower']">
						<FormSlot>
							<template #label><SearchLabel>{{ i18n.ts._accountSettings.makeNotesFollowersOnlyBefore }}</SearchLabel></template>

							<div class="_gaps_s">
								<MkSelect :modelValue="makeNotesFollowersOnlyBefore_type" @update:modelValue="makeNotesFollowersOnlyBefore = $event === 'relative' ? -604800 : $event === 'absolute' ? Math.floor(Date.now() / 1000) : null">
									<option :value="null">{{ i18n.ts.none }}</option>
									<option value="relative">{{ i18n.ts._accountSettings.notesHavePassedSpecifiedPeriod }}</option>
									<option value="absolute">{{ i18n.ts._accountSettings.notesOlderThanSpecifiedDateAndTime }}</option>
								</MkSelect>

								<MkSelect v-if="makeNotesFollowersOnlyBefore_type === 'relative'" v-model="makeNotesFollowersOnlyBefore">
									<option :value="-3600">{{ i18n.ts.oneHour }}</option>
									<option :value="-86400">{{ i18n.ts.oneDay }}</option>
									<option :value="-259200">{{ i18n.ts.threeDays }}</option>
									<option :value="-604800">{{ i18n.ts.oneWeek }}</option>
									<option :value="-2592000">{{ i18n.ts.oneMonth }}</option>
									<option :value="-7776000">{{ i18n.ts.threeMonths }}</option>
									<option :value="-31104000">{{ i18n.ts.oneYear }}</option>
								</MkSelect>

								<MkInput
									v-if="makeNotesFollowersOnlyBefore_type === 'absolute'"
									:modelValue="formatDateTimeString(new Date(makeNotesFollowersOnlyBefore * 1000), 'yyyy-MM-dd')"
									type="date"
									:manualSave="true"
									@update:modelValue="makeNotesFollowersOnlyBefore = Math.floor(new Date($event).getTime() / 1000)"
								>
								</MkInput>
							</div>

							<template #caption>
								<div><SearchKeyword>{{ i18n.ts._accountSettings.makeNotesFollowersOnlyBeforeDescription }}</SearchKeyword></div>
								<div v-if="instance.federation !== 'none'"><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._accountSettings.mayNotEffectForFederatedNotes }}</div>
							</template>
						</FormSlot>
					</SearchMarker>

					<SearchMarker :keywords="['hidden']">
						<FormSlot>
							<template #label><SearchLabel>{{ i18n.ts._accountSettings.makeNotesHiddenBefore }}</SearchLabel></template>

							<div class="_gaps_s">
								<MkSelect :modelValue="makeNotesHiddenBefore_type" @update:modelValue="makeNotesHiddenBefore = $event === 'relative' ? -604800 : $event === 'absolute' ? Math.floor(Date.now() / 1000) : null">
									<option :value="null">{{ i18n.ts.none }}</option>
									<option value="relative">{{ i18n.ts._accountSettings.notesHavePassedSpecifiedPeriod }}</option>
									<option value="absolute">{{ i18n.ts._accountSettings.notesOlderThanSpecifiedDateAndTime }}</option>
								</MkSelect>

								<MkSelect v-if="makeNotesHiddenBefore_type === 'relative'" v-model="makeNotesHiddenBefore">
									<option :value="-3600">{{ i18n.ts.oneHour }}</option>
									<option :value="-86400">{{ i18n.ts.oneDay }}</option>
									<option :value="-259200">{{ i18n.ts.threeDays }}</option>
									<option :value="-604800">{{ i18n.ts.oneWeek }}</option>
									<option :value="-2592000">{{ i18n.ts.oneMonth }}</option>
									<option :value="-7776000">{{ i18n.ts.threeMonths }}</option>
									<option :value="-31104000">{{ i18n.ts.oneYear }}</option>
								</MkSelect>

								<MkInput
									v-if="makeNotesHiddenBefore_type === 'absolute'"
									:modelValue="formatDateTimeString(new Date(makeNotesHiddenBefore * 1000), 'yyyy-MM-dd')"
									type="date"
									:manualSave="true"
									@update:modelValue="makeNotesHiddenBefore = Math.floor(new Date($event).getTime() / 1000)"
								>
								</MkInput>
							</div>

							<template #caption>
								<div><SearchKeyword>{{ i18n.ts._accountSettings.makeNotesHiddenBeforeDescription }}</SearchKeyword></div>
								<div v-if="instance.federation !== 'none'"><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._accountSettings.mayNotEffectForFederatedNotes }}</div>
							</template>
						</FormSlot>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<FormSection>
			<div class="_gaps_m">
				<SearchMarker :keywords="['remember', 'keep', 'note', 'visibility']">
					<MkPreferenceContainer k="rememberNoteVisibility">
						<MkSwitch v-model="rememberNoteVisibility" @update:modelValue="save()">
							<template #label><SearchLabel>{{ i18n.ts.rememberNoteVisibility }}</SearchLabel></template>
						</MkSwitch>
					</MkPreferenceContainer>
				</SearchMarker>

				<SearchMarker :keywords="['default', 'note', 'visibility']">
					<MkDisableSection :disabled="rememberNoteVisibility">
						<MkFolder>
							<template #label><SearchLabel>{{ i18n.ts.defaultNoteVisibility }}</SearchLabel></template>
							<template v-if="defaultNoteVisibility === 'public'" #suffix>{{ i18n.ts._visibility.public }}</template>
							<template v-else-if="defaultNoteVisibility === 'home'" #suffix>{{ i18n.ts._visibility.home }}</template>
							<template v-else-if="defaultNoteVisibility === 'followers'" #suffix>{{ i18n.ts._visibility.followers }}</template>
							<template v-else-if="defaultNoteVisibility === 'specified'" #suffix>{{ i18n.ts._visibility.specified }}</template>

							<div class="_gaps_m">
								<MkPreferenceContainer k="defaultNoteVisibility">
									<MkSelect v-model="defaultNoteVisibility">
										<option value="public">{{ i18n.ts._visibility.public }}</option>
										<option value="home">{{ i18n.ts._visibility.home }}</option>
										<option value="followers">{{ i18n.ts._visibility.followers }}</option>
										<option value="specified">{{ i18n.ts._visibility.specified }}</option>
									</MkSelect>
								</MkPreferenceContainer>

								<MkPreferenceContainer k="defaultNoteLocalOnly">
									<MkSwitch v-model="defaultNoteLocalOnly">{{ i18n.ts._visibility.disableFederation }}</MkSwitch>
								</MkPreferenceContainer>
							</div>
						</MkFolder>
					</MkDisableSection>
				</SearchMarker>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { signinRequired } from '@/account.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import FormSlot from '@/components/form/slot.vue';
import { formatDateTimeString } from '@/scripts/format-time-string.js';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os.js';
import MkDisableSection from '@/components/MkDisableSection.vue';
import { prefer } from '@/preferences.js';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';

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

const defaultNoteVisibility = prefer.model('defaultNoteVisibility');
const defaultNoteLocalOnly = prefer.model('defaultNoteLocalOnly');
const rememberNoteVisibility = prefer.model('rememberNoteVisibility');

const makeNotesFollowersOnlyBefore_type = computed(() => {
	if (makeNotesFollowersOnlyBefore.value == null) {
		return null;
	} else if (makeNotesFollowersOnlyBefore.value >= 0) {
		return 'absolute';
	} else {
		return 'relative';
	}
});

const makeNotesHiddenBefore_type = computed(() => {
	if (makeNotesHiddenBefore.value == null) {
		return null;
	} else if (makeNotesHiddenBefore.value >= 0) {
		return 'absolute';
	} else {
		return 'relative';
	}
});

watch([makeNotesFollowersOnlyBefore, makeNotesHiddenBefore], () => {
	save();
});

async function update_requireSigninToViewContents(value: boolean) {
	if (value === true && instance.federation !== 'none') {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.ts.acknowledgeNotesAndEnable,
		});
		if (canceled) return;
	}

	requireSigninToViewContents.value = value;
	save();
}

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
