<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/privacy" :label="i18n.ts.privacy" :keywords="['privacy']" icon="ti ti-lock-open">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/unlocked_3d.png" color="#aeff00">
			<SearchKeyword>{{ i18n.ts._settings.privacyBanner }}</SearchKeyword>
		</MkFeatureBanner>

		<SearchMarker :keywords="['follow', 'lock']">
			<MkSwitch v-model="isLocked" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.makeFollowManuallyApprove }}</SearchLabel></template>
				<template #caption><SearchKeyword>{{ i18n.ts.lockedAccountInfo }}</SearchKeyword></template>
			</MkSwitch>
		</SearchMarker>

		<MkDisableSection :disabled="!isLocked">
			<div class="_gaps_s">
				<SearchMarker :keywords="['follow', 'auto', 'accept']">
					<MkSwitch v-model="autoAcceptFollowed" @update:modelValue="save()">
						<template #label><SearchLabel>{{ i18n.ts.autoAcceptFollowed }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['follow', 'auto', 'reject', 'request']">
					<MkSwitch v-model="autoRejectFollowRequest" @update:modelValue="save()">
						<template #label><SearchLabel>{{ i18n.ts.autoRejectFollowRequest }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
						<template #caption><SearchKeyword>{{ i18n.ts.autoRejectFollowRequestDescription }}</SearchKeyword></template>
					</MkSwitch>
				</SearchMarker>
			</div>
		</MkDisableSection>

		<SearchMarker :keywords="['reaction', 'public']">
			<MkSwitch v-model="publicReactions" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.makeReactionsPublic }}</SearchLabel></template>
				<template #caption><SearchKeyword>{{ i18n.ts.makeReactionsPublicDescription }}</SearchKeyword></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['activity', 'hide', 'visibility']">
			<MkSwitch v-model="hideActivity" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.hideActivity }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
				<template #caption><SearchKeyword>{{ i18n.ts.hideActivityDescription }}</SearchKeyword></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['profile', 'files', 'hide', 'visibility']">
			<MkSwitch v-model="hideProfileFiles" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.hideProfileFiles }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
				<template #caption><SearchKeyword>{{ i18n.ts.hideProfileFilesDescription }}</SearchKeyword></template>
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

		<SearchMarker :keywords="['notes', 'visibility']">
			<MkSelect v-model="notesVisibility" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.notesVisibility }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
				<option value="public">{{ i18n.ts._ffVisibility.public }}</option>
				<option value="followers">{{ i18n.ts._ffVisibility.followers }}</option>
				<option value="private">{{ i18n.ts._ffVisibility.private }}</option>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['active', 'status', 'visibility', 'online']">
			<MkSelect v-model="activeStatusVisibility.type" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.activeStatusVisibility }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
				<option value="all">{{ i18n.ts.public }}</option>
				<option value="following">{{ i18n.ts.following }}</option>
				<option value="followers">{{ i18n.ts.followers }}</option>
				<option value="mutualFollow">{{ i18n.ts.mutualFollow }}</option>
				<option value="followingOrFollower">{{ i18n.ts.followingOrFollower }}</option>
				<option value="list">{{ i18n.ts.lists }}</option>
				<option value="never">{{ i18n.ts.private }}</option>
			</MkSelect>

			<div v-if="activeStatusVisibility.type === 'list'" class="_panel" style="padding: 12px; margin-top: 8px; background: var(--panelHighlight); border-radius: 8px;">
				<!-- リストが選択されていない場合は追加ボタンを表示 -->
				<div v-if="!activeStatusVisibility.userListId || !selectedList">
					<MkButton primary full @click="selectActiveStatusList()">
						<i class="ti ti-plus" style="margin-right: 6px;"></i>
						{{ i18n.ts.selectList }}
					</MkButton>
				</div>

				<!-- リストが選択されている場合はリスト名と削除ボタンを表示 -->
				<div v-else>
					<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
						<div style="display: flex; align-items: center; flex-grow: 1; overflow: hidden;">
							<i class="ti ti-list" style="margin-right: 8px;"></i>
							<span style="font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
								{{ selectedList.name }}
							</span>
						</div>
						<MkButton danger compact style="margin-left: 8px;" @click="removeActiveStatusList()">
							<i class="ti ti-trash"></i>
							<span class="text">{{ i18n.ts.remove }}</span>
						</MkButton>
					</div>
				</div>
			</div>
		</searchmarker>

		<MkSwitch v-model="hideOnlineStatus" @update:modelValue="save()">
			{{ i18n.ts.hideOnlineStatus }}
			<template #caption>{{ i18n.ts.hideOnlineStatusDescription }}</template>
		</MkSwitch>
		<MkSwitch v-model="hideSearchResult" @update:modelValue="save()">
			<template #label><SearchLabel>{{ i18n.ts.hideSearchResult }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
			<template #caption><SearchKeyword>{{ i18n.ts.hideSearchResultDescription }}</SearchKeyword></template>
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

		<SearchMarker :keywords="['chat']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.chat }}</SearchLabel></template>

				<div class="_gaps_m">
					<MkInfo v-if="$i.policies.chatAvailability === 'unavailable'">{{ i18n.ts._chat.chatNotAvailableForThisAccountOrServer }}</MkInfo>
					<SearchMarker :keywords="['chat']">
						<MkSelect v-model="chatScope" @update:modelValue="save()">
							<template #label><SearchLabel>{{ i18n.ts._chat.chatAllowedUsers }}</SearchLabel></template>
							<option value="everyone">{{ i18n.ts._chat._chatAllowedUsers.everyone }}</option>
							<option value="followers">{{ i18n.ts._chat._chatAllowedUsers.followers }}</option>
							<option value="following">{{ i18n.ts._chat._chatAllowedUsers.following }}</option>
							<option value="mutual">{{ i18n.ts._chat._chatAllowedUsers.mutual }}</option>
							<option value="none">{{ i18n.ts._chat._chatAllowedUsers.none }}</option>
							<template #caption>{{ i18n.ts._chat.chatAllowedUsers_note }}</template>
						</MkSelect>
					</SearchMarker>
				</div>
			</FormSection>
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
							</template>
						</FormSlot>
					</SearchMarker>

					<MkInfo warn>{{ i18n.ts._accountSettings.mayNotEffectSomeSituations }}</MkInfo>
				</div>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { ensureSignin } from '@/i.js';
import { definePage } from '@/page.js';
import FormSlot from '@/components/form/slot.vue';
import { formatDateTimeString } from '@/utility/format-time-string.js';
import MkInput from '@/components/MkInput.vue';
import MkDisableSection from '@/components/MkDisableSection.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import * as os from '@/os.js';

const $i = ensureSignin();

const isLocked = ref($i.isLocked);
const autoAcceptFollowed = ref($i.autoAcceptFollowed);
const autoRejectFollowRequest = ref($i.autoRejectFollowRequest);
const noCrawle = ref($i.noCrawle);
const preventAiLearning = ref($i.preventAiLearning);
const isExplorable = ref($i.isExplorable);
const requireSigninToViewContents = ref($i.requireSigninToViewContents ?? false);
const makeNotesFollowersOnlyBefore = ref($i.makeNotesFollowersOnlyBefore ?? null);
const makeNotesHiddenBefore = ref($i.makeNotesHiddenBefore ?? null);
const hideOnlineStatus = ref($i.hideOnlineStatus);
const hideSearchResult = ref($i.hideSearchResult);
const publicReactions = ref($i.publicReactions);
const hideActivity = ref($i.hideActivity);
const hideProfileFiles = ref($i.hideProfileFiles);
const notesVisibility = ref($i.notesVisibility);
const followingVisibility = ref($i.followingVisibility);
const followersVisibility = ref($i.followersVisibility);
const ffVisibility = ref($i.ffVisibility);
const activeStatusVisibility = ref($i.activeStatusVisibility);
const chatScope = ref($i.chatScope);

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

// 選択されているリスト情報を取得する
const selectedList = computed(() => {
	if (!activeStatusVisibility.value?.type === 'list' || !activeStatusVisibility.value?.userListId) return null;
	return userLists.value.find(list => list.id === activeStatusVisibility.value.userListId) || null;
});

// リスト選択ダイアログを表示
async function selectActiveStatusList() {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: list } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(x => ({
			value: x, text: x.name,
		})),
	});
	if (canceled) return;
	if (list == null) return;

	// 選択されたリストをセット
	activeStatusVisibility.value = {
		type: 'list',
		userListId: list.id,
	};
	save();
}

// 選択されたリストをクリア
function removeActiveStatusList() {
	activeStatusVisibility.value = {
		type: 'list',
		userListId: null,
	};
	save();
}

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
		autoRejectFollowRequest: !!autoRejectFollowRequest.value,
		noCrawle: !!noCrawle.value,
		preventAiLearning: !!preventAiLearning.value,
		isExplorable: !!isExplorable.value,
		requireSigninToViewContents: !!requireSigninToViewContents.value,
		makeNotesFollowersOnlyBefore: makeNotesFollowersOnlyBefore.value,
		makeNotesHiddenBefore: makeNotesHiddenBefore.value,
		hideOnlineStatus: !!hideOnlineStatus.value,
		hideSearchResult: !!hideSearchResult.value,
		publicReactions: !!publicReactions.value,
		hideActivity: !!hideActivity.value,
		hideProfileFiles: !!hideProfileFiles.value,
		notesVisibility: notesVisibility.value,
		followingVisibility: followingVisibility.value,
		followersVisibility: followersVisibility.value,
		ffVisibility: ffVisibility.value,
		activeStatusVisibility: activeStatusVisibility.value,
		chatScope: chatScope.value,
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.privacy,
	icon: 'ti ti-lock-open',
}));

// ユーザーリストのデータ取得のみ保持
const userLists = ref([]);

// コンポーネントマウント時にユーザーリストを取得
onMounted(async () => {
	try {
		userLists.value = await misskeyApi('users/lists/list');
	} catch (e) {
		console.error('Failed to fetch user lists', e);
	}
});
</script>
