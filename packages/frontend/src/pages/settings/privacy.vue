<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/privacy" :label="i18n.ts.privacy" :keywords="['privacy']" icon="ti ti-lock-open">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/unlocked_3d.png" color="#aeff00">
			<SearchText>{{ i18n.ts._settings.privacyBanner }}</SearchText>
		</MkFeatureBanner>

		<SearchMarker :keywords="['follow', 'lock']">
			<MkSwitch v-model="isLocked" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.makeFollowManuallyApprove }}</SearchLabel></template>
				<template #caption><SearchText>{{ i18n.ts.lockedAccountInfo }}</SearchText></template>
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
						<template #caption><SearchText>{{ i18n.ts.autoRejectFollowRequestDescription }}</SearchText></template>
					</MkSwitch>
				</SearchMarker>
			</div>
		</MkDisableSection>

		<SearchMarker :keywords="['reaction', 'public']">
			<MkSwitch v-model="publicReactions" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.makeReactionsPublic }}</SearchLabel></template>
				<template #caption><SearchText>{{ i18n.ts.noCrawleDescription }}</SearchText></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['activity', 'hide', 'visibility']">
			<MkSwitch v-model="hideActivity" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.hideActivity }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
				<template #caption><SearchText>{{ i18n.ts.hideActivityDescription }}</SearchText></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['profile', 'files', 'hide', 'visibility']">
			<MkSwitch v-model="hideProfileFiles" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.hideProfileFiles }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
				<template #caption><SearchText>{{ i18n.ts.hideProfileFilesDescription }}</SearchText></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['following', 'visibility']">
			<MkSelect v-model="followingVisibility" :items="followingVisibilityDef" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.followingVisibility }}</SearchLabel></template>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['follower', 'visibility']">
			<MkSelect v-model="followersVisibility" :items="followersVisibilityDef" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.followersVisibility }}</SearchLabel></template>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['notes', 'visibility']">
			<MkSelect v-model="notesVisibility" :items="notesVisibilityDef" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.notesVisibility }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
				<template #caption><SearchText>{{ i18n.ts.hideOnlineStatusDescription }}</SearchText></template>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['online', 'status']">
			<MkSwitch v-model="hideOnlineStatus" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.hideOnlineStatus }}</SearchLabel></template>
				<template #caption><SearchText>{{ i18n.ts.hideOnlineStatusDescription }}</SearchText></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['active', 'status', 'visibility', 'online']">
			<MkSelect v-model="activeStatusVisibilityType" :items="activeStatusVisibilityTypeDef" @update:modelValue="save()">
				<template #label><SearchLabel>{{ i18n.ts.activeStatusVisibility }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
			</MkSelect>

			<div v-if="activeStatusVisibilityType === 'list'" class="_panel" style="padding: 12px; margin-top: 8px; background: var(--panelHighlight); border-radius: 8px;">
				<!-- リストが選択されていない場合は追加ボタンを表示 -->
				<div v-if="activeStatusVisibility.type === 'list' && (!activeStatusVisibility.userListId || !selectedList)">
					<MkButton primary full @click="selectActiveStatusList()">
						<i class="ti ti-plus" style="margin-right: 6px;"></i>
						{{ i18n.ts.selectList }}
					</MkButton>
				</div>

				<!-- リストが選択されている場合はリスト名と削除ボタンを表示 -->
				<div v-else-if="selectedList">
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
		<MkSwitch v-model="hideNoteSearchResult" @update:modelValue="save()">
			<template #label><SearchLabel>{{ i18n.ts.hideNoteSearchResult }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
			<template #caption><SearchText>{{ i18n.ts.hideNoteSearchResultDescription }}</SearchText></template>
		</MkSwitch>
		<MkSwitch v-model="hideUserSearchResult" @update:modelValue="save()">
			<template #label><SearchLabel>{{ i18n.ts.hideUserSearchResult }}</SearchLabel><span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
			<template #caption><SearchText>{{ i18n.ts.hideUserSearchResultDescription }}</SearchText></template>
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
				<template #label><SearchLabel>{{ i18n.ts.directMessage }}</SearchLabel></template>

				<div class="_gaps_m">
					<MkInfo v-if="$i.policies.chatAvailability === 'unavailable'">{{ i18n.ts._chat.chatNotAvailableForThisAccountOrServer }}</MkInfo>
					<SearchMarker :keywords="['chat']">
						<MkSelect v-model="chatScope" :items="chatScopeDef" @update:modelValue="save()">
							<template #label><SearchLabel>{{ i18n.ts._chat.chatAllowedUsers }}</SearchLabel></template>
							<template #caption>{{ i18n.ts._chat.chatAllowedUsers_note }}</template>
						</MkSelect>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['lockdown']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.lockdown }}</SearchLabel></template>

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
								<MkSelect
									v-model="makeNotesFollowersOnlyBefore_type"
									:items="[
										{ label: i18n.ts.none, value: null },
										{ label: i18n.ts._accountSettings.notesHavePassedSpecifiedPeriod, value: 'relative' },
										{ label: i18n.ts._accountSettings.notesOlderThanSpecifiedDateAndTime, value: 'absolute' },
									]"
								>
								</MkSelect>

								<MkSelect
									v-if="makeNotesFollowersOnlyBefore_type === 'relative'"
									v-model="makeNotesFollowersOnlyBefore_selection"
									:items="[
										...makeNotesFollowersOnlyBefore_presets,
										{ label: i18n.ts.custom, value: 'custom' },
									]"
								>
								</MkSelect>

								<MkInput
									v-if="makeNotesFollowersOnlyBefore_type === 'relative' && makeNotesFollowersOnlyBefore_isCustomMode"
									v-model="makeNotesFollowersOnlyBefore_customMonths"
									type="number"
									:min="1"
								>
									<template #suffix>{{ i18n.ts._time.month }}</template>
								</MkInput>

								<MkInput
									v-if="makeNotesFollowersOnlyBefore_type === 'absolute' && makeNotesFollowersOnlyBefore != null"
									:modelValue="formatDateTimeString(new Date(makeNotesFollowersOnlyBefore * 1000), 'yyyy-MM-dd')"
									type="date"
									:manualSave="true"
									@update:modelValue="makeNotesFollowersOnlyBefore = Math.floor(new Date($event).getTime() / 1000)"
								>
								</MkInput>
							</div>

							<template #caption>
								<div><SearchText>{{ i18n.ts._accountSettings.makeNotesFollowersOnlyBeforeDescription }}</SearchText></div>
							</template>
						</FormSlot>
					</SearchMarker>

					<SearchMarker :keywords="['hidden']">
						<FormSlot>
							<template #label><SearchLabel>{{ i18n.ts._accountSettings.makeNotesHiddenBefore }}</SearchLabel></template>

							<div class="_gaps_s">
								<MkSelect
									v-model="makeNotesHiddenBefore_type"
									:items="[
										{ label: i18n.ts.none, value: null },
										{ label: i18n.ts._accountSettings.notesHavePassedSpecifiedPeriod, value: 'relative' },
										{ label: i18n.ts._accountSettings.notesOlderThanSpecifiedDateAndTime, value: 'absolute' },
									]"
								>
								</MkSelect>

								<MkSelect
									v-if="makeNotesHiddenBefore_type === 'relative'"
									v-model="makeNotesHiddenBefore_selection"
									:items="[
										...makeNotesHiddenBefore_presets,
										{ label: i18n.ts.custom, value: 'custom' },
									]"
								>
								</MkSelect>

								<MkInput
									v-if="makeNotesHiddenBefore_type === 'relative' && makeNotesHiddenBefore_isCustomMode"
									v-model="makeNotesHiddenBefore_customMonths"
									type="number"
									:min="1"
								>
									<template #suffix>{{ i18n.ts._time.month }}</template>
								</MkInput>

								<MkInput
									v-if="makeNotesHiddenBefore_type === 'absolute' && makeNotesHiddenBefore != null"
									:modelValue="formatDateTimeString(new Date(makeNotesHiddenBefore * 1000), 'yyyy-MM-dd')"
									type="date"
									:manualSave="true"
									@update:modelValue="makeNotesHiddenBefore = Math.floor(new Date($event).getTime() / 1000)"
								>
								</MkInput>
							</div>

							<template #caption>
								<div><SearchText>{{ i18n.ts._accountSettings.makeNotesHiddenBeforeDescription }}</SearchText></div>
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
import type { MkSelectItem } from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSection from '@/components/form/section.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { ensureSignin } from '@/i.js';
import { definePage } from '@/page.js';
import FormSlot from '@/components/form/slot.vue';
import { formatDateTimeString } from '@/utility/format-time-string.js';
import { useMkSelect } from '@/composables/use-mkselect.js';
import MkInput from '@/components/MkInput.vue';
import MkDisableSection from '@/components/MkDisableSection.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import * as os from '@/os.js';

const $i = ensureSignin();

const isLocked = ref($i.isLocked);
const autoAcceptFollowed = ref($i.autoAcceptFollowed);
const autoRejectFollowRequest = ref($i.autoRejectFollowRequest ?? false);
const noCrawle = ref($i.noCrawle);
const preventAiLearning = ref($i.preventAiLearning);
const isExplorable = ref($i.isExplorable);
const requireSigninToViewContents = ref($i.requireSigninToViewContents ?? false);
const makeNotesFollowersOnlyBefore = ref($i.makeNotesFollowersOnlyBefore ?? null);
const makeNotesHiddenBefore = ref($i.makeNotesHiddenBefore ?? null);
const hideOnlineStatus = ref($i.hideOnlineStatus);
const hideNoteSearchResult = ref($i.hideNoteSearchResult);
const hideUserSearchResult = ref($i.hideUserSearchResult);
const publicReactions = ref($i.publicReactions);
const hideActivity = ref($i.hideActivity);
const hideProfileFiles = ref($i.hideProfileFiles);
const {
	model: notesVisibility,
	def: notesVisibilityDef,
} = useMkSelect({
	items: [
		{ label: i18n.ts._ffVisibility.public, value: 'public' },
		{ label: i18n.ts._ffVisibility.followers, value: 'followers' },
		{ label: i18n.ts._ffVisibility.private, value: 'private' },
	],
	initialValue: $i.notesVisibility,
});
const {
	model: followingVisibility,
	def: followingVisibilityDef,
} = useMkSelect({
	items: [
		{ label: i18n.ts.public, value: 'public' },
		{ label: i18n.ts.followers, value: 'followers' },
		{ label: i18n.ts.private, value: 'private' },
	],
	initialValue: $i.followingVisibility,
});
const {
	model: followersVisibility,
	def: followersVisibilityDef,
} = useMkSelect({
	items: [
		{ label: i18n.ts.public, value: 'public' },
		{ label: i18n.ts.followers, value: 'followers' },
		{ label: i18n.ts.private, value: 'private' },
	],
	initialValue: $i.followersVisibility,
});
const ffVisibility = ref(($i as any).ffVisibility ?? 'public');
const activeStatusVisibility = ref($i.activeStatusVisibility);
const {
	model: activeStatusVisibilityType,
	def: activeStatusVisibilityTypeDef,
} = useMkSelect({
	items: [
		{ label: i18n.ts.public, value: 'all' },
		{ label: i18n.ts.following, value: 'following' },
		{ label: i18n.ts.followers, value: 'followers' },
		{ label: i18n.ts.mutualFollow, value: 'mutualFollow' },
		{ label: i18n.ts.followingOrFollower, value: 'followingOrFollower' },
		{ label: i18n.ts.lists, value: 'list' },
		{ label: i18n.ts.private, value: 'never' },
	],
	initialValue: $i.activeStatusVisibility?.type ?? 'all',
});
const {
	model: chatScope,
	def: chatScopeDef,
} = useMkSelect({
	items: [
		{ label: i18n.ts._chat._chatAllowedUsers.everyone, value: 'everyone' },
		{ label: i18n.ts._chat._chatAllowedUsers.followers, value: 'followers' },
		{ label: i18n.ts._chat._chatAllowedUsers.following, value: 'following' },
		{ label: i18n.ts._chat._chatAllowedUsers.mutual, value: 'mutual' },
		{ label: i18n.ts._chat._chatAllowedUsers.none, value: 'none' },
	],
	initialValue: $i.chatScope,
});

const makeNotesFollowersOnlyBefore_type = computed({
	get: () => {
		if (makeNotesFollowersOnlyBefore.value == null) {
			return null;
		} else if (makeNotesFollowersOnlyBefore.value >= 0) {
			return 'absolute';
		} else {
			return 'relative';
		}
	},
	set(value) {
		if (value === 'relative') {
			makeNotesFollowersOnlyBefore.value = -604800;
		} else if (value === 'absolute') {
			makeNotesFollowersOnlyBefore.value = Math.floor(Date.now() / 1000);
		} else {
			makeNotesFollowersOnlyBefore.value = null;
		}
	},
});

const makeNotesFollowersOnlyBefore_presets = [
	{ label: i18n.ts.oneHour, value: -3600 },
	{ label: i18n.ts.oneDay, value: -86400 },
	{ label: i18n.ts.threeDays, value: -259200 },
	{ label: i18n.ts.oneWeek, value: -604800 },
	{ label: i18n.ts.oneMonth, value: -2592000 },
	{ label: i18n.ts.threeMonths, value: -7776000 },
	{ label: i18n.ts.oneYear, value: -31104000 },
] satisfies MkSelectItem[];

const makeNotesFollowersOnlyBefore_isCustomMode = ref(
	makeNotesFollowersOnlyBefore.value != null &&
	makeNotesFollowersOnlyBefore.value < 0 &&
	!makeNotesFollowersOnlyBefore_presets.some((preset) => preset.value === makeNotesFollowersOnlyBefore.value),
);

const makeNotesFollowersOnlyBefore_selection = computed({
	get: () => makeNotesFollowersOnlyBefore_isCustomMode.value ? 'custom' : makeNotesFollowersOnlyBefore.value,
	set(value) {
		makeNotesFollowersOnlyBefore_isCustomMode.value = value === 'custom';
		if (value !== 'custom') makeNotesFollowersOnlyBefore.value = value;
	},
});

const makeNotesFollowersOnlyBefore_customMonths = computed({
	get: () => makeNotesFollowersOnlyBefore.value ? Math.abs(makeNotesFollowersOnlyBefore.value) / (30 * 24 * 60 * 60) : null,
	set(value) {
		if (value != null && value > 0) makeNotesFollowersOnlyBefore.value = -Math.abs(Math.floor(Number(value))) * 30 * 24 * 60 * 60;
	},
});

const makeNotesHiddenBefore_type = computed({
	get: () => {
		if (makeNotesHiddenBefore.value == null) {
			return null;
		} else if (makeNotesHiddenBefore.value >= 0) {
			return 'absolute';
		} else {
			return 'relative';
		}
	},
	set(value) {
		if (value === 'relative') {
			makeNotesHiddenBefore.value = -604800;
		} else if (value === 'absolute') {
			makeNotesHiddenBefore.value = Math.floor(Date.now() / 1000);
		} else {
			makeNotesHiddenBefore.value = null;
		}
	},
});

const makeNotesHiddenBefore_presets = [
	{ label: i18n.ts.oneHour, value: -3600 },
	{ label: i18n.ts.oneDay, value: -86400 },
	{ label: i18n.ts.threeDays, value: -259200 },
	{ label: i18n.ts.oneWeek, value: -604800 },
	{ label: i18n.ts.oneMonth, value: -2592000 },
	{ label: i18n.ts.threeMonths, value: -7776000 },
	{ label: i18n.ts.oneYear, value: -31104000 },
] satisfies MkSelectItem[];

const makeNotesHiddenBefore_isCustomMode = ref(
	makeNotesHiddenBefore.value != null &&
	makeNotesHiddenBefore.value < 0 &&
	!makeNotesHiddenBefore_presets.some((preset) => preset.value === makeNotesHiddenBefore.value),
);

const makeNotesHiddenBefore_selection = computed({
	get: () => makeNotesHiddenBefore_isCustomMode.value ? 'custom' : makeNotesHiddenBefore.value,
	set(value) {
		makeNotesHiddenBefore_isCustomMode.value = value === 'custom';
		if (value !== 'custom') makeNotesHiddenBefore.value = value;
	},
});

const makeNotesHiddenBefore_customMonths = computed({
	get: () => makeNotesHiddenBefore.value ? Math.abs(makeNotesHiddenBefore.value) / (30 * 24 * 60 * 60) : null,
	set(value) {
		if (value != null && value > 0) makeNotesHiddenBefore.value = -Math.abs(Math.floor(Number(value))) * 30 * 24 * 60 * 60;
	},
});

watch([makeNotesFollowersOnlyBefore, makeNotesHiddenBefore], () => {
	save();
});

// activeStatusVisibilityType の変更を activeStatusVisibility に反映
watch(activeStatusVisibilityType, (newType) => {
	if (newType === 'list') {
		// リストモードに変更された場合、既存のuserListIdを保持
		if (activeStatusVisibility.value?.type !== 'list') {
			activeStatusVisibility.value = {
				type: 'list',
				userListId: '' as any,
			};
		}
	} else {
		// リスト以外のモードに変更された場合
		activeStatusVisibility.value = {
			type: newType,
		} as any;
	}
});

// 選択されているリスト情報を取得する
const selectedList = computed(() => {
	const visibility = activeStatusVisibility.value;
	if (visibility?.type !== 'list' || !visibility.userListId) return null;
	return userLists.value.find(list => list.id === visibility.userListId) || null;
});

// リスト選択ダイアログを表示
async function selectActiveStatusList() {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: listId } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(x => ({
			value: x.id,
			text: x.name,
			label: x.name,
		})),
	});
	if (canceled) return;
	if (listId == null) return;

	// 選択されたリストをセット
	activeStatusVisibility.value = {
		type: 'list',
		userListId: String(listId),
	};
	save();
}

// 選択されたリストをクリア
function removeActiveStatusList() {
	activeStatusVisibility.value = {
		type: 'list',
		userListId: '' as any,
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
		hideNoteSearchResult: !!hideNoteSearchResult.value,
		hideUserSearchResult: !!hideUserSearchResult.value,
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
const userLists = ref<Array<{
	id: string;
	createdAt: string;
	name: string;
	userIds?: string[];
	isPublic: boolean;
}>>([]);

// コンポーネントマウント時にユーザーリストを取得
onMounted(async () => {
	try {
		userLists.value = await misskeyApi('users/lists/list');
	} catch (e) {
		console.error('Failed to fetch user lists', e);
	}
});
</script>
