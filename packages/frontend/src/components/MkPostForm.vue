<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, { [$style.modal]: modal, _popup: modal }]"
	@dragover.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<header :class="$style.header">
		<div :class="$style.headerLeft">
			<button v-if="!fixed" :class="$style.cancel" class="_button" @click="cancel"><i class="ti ti-x"></i></button>
			<button ref="accountMenuEl" v-click-anime v-tooltip="i18n.ts.account" :class="$style.account" class="_button" @click="openAccountMenu">
				<img :class="$style.avatar" :src="(postAccount ?? $i).avatarUrl" style="border-radius: 100%;"/>
			</button>
		</div>
		<div :class="$style.headerRight">
			<template v-if="targetChannel == null">
				<!-- やみノート切り替えボタン - canYamiNote権限がある場合に表示 -->
				<button
					v-if="$i.policies?.canYamiNote"
					v-tooltip="parentIsYamiNote
						? i18n.ts._yami.parentIsYamiNote
						: props.fixed && (props.isInYamiTimeline || props.isInNormalTimeline)
							? (isNoteInYamiMode ? i18n.ts._yami.fixedYamiNote : i18n.ts._yami.fixedNormalNote)
							: (isNoteInYamiMode ? i18n.ts._yami.yamiNote : i18n.ts._yami.normalNote)"
					:class="['_button', $style.headerRightItem, { [$style.danger]: !isNoteInYamiMode && !parentIsYamiNote }]"
					:disabled="parentIsYamiNote || (props.fixed && (props.isInYamiTimeline || props.isInNormalTimeline))"
					@click="toggleYamiMode"
				>
					<i class="ti" :class="isNoteInYamiMode || parentIsYamiNote ? 'ti-moon' : 'ti-moon-off'"></i>
				</button>

				<!-- 既存の公開範囲ボタン -->
				<button
					v-if="targetChannel == null" ref="visibilityButton" v-tooltip="i18n.ts.visibility"
					:class="['_button', $style.headerRightItem, $style.visibility]" @click="setVisibility"
				>
					<span v-if="displayVisibility === 'public'"><i class="ti ti-world"></i></span>
					<span v-if="displayVisibility === 'home'"><i class="ti ti-home"></i></span>
					<span v-if="displayVisibility === 'followers'"><i class="ti ti-lock"></i></span>
					<span v-if="displayVisibility === 'specified'"><i class="ti ti-mail"></i></span>
					<span v-if="displayVisibility === 'private'"><i class="ti ti-eye-closed"></i></span>
					<span :class="$style.headerRightButtonText">
						{{ i18n.ts._visibility[displayVisibility] }}
					</span>
				</button>
				<button v-else class="_button" :class="[$style.headerRightItem, $style.visibility]" disabled>
					<span><i class="ti ti-device-tv"></i></span>
					<span :class="$style.headerRightButtonText">{{ targetChannelName }}</span>
				</button>
			</template>
			<!-- 連合設定ボタン -->
			<button
				v-tooltip="$i.policies?.canFederateNote === false
					? (isNoteInYamiMode
						? i18n.ts._visibility.yamiNoteFederationDisabled
						: i18n.ts._visibility.noteFederationDisabled)
					: (isNoteInYamiMode
						? (yamiNoteFederationEnabled
							? (localOnly ? i18n.ts._visibility.disableFederation : i18n.ts._visibility.yamiNoteFederationEnabled)
							: i18n.ts._visibility.yamiNoteFederationDisabled)
						: (localOnly ? i18n.ts._visibility.disableFederation : i18n.ts._visibility.enableFederation))"
				class="_button"
				:class="[$style.headerRightItem, {
					[$style.danger]: localOnly,
					[$style.warning]: isNoteInYamiMode && !localOnly,
					[$style.disabled]: isFederationToggleDisabled
				}]"
				:disabled="isFederationToggleDisabled"
				@click="toggleLocalOnly"
			>
				<span v-if="!localOnly && $i.policies?.canFederateNote !== false"><i class="ti ti-rocket"></i></span>
				<span v-else><i class="ti ti-rocket-off"></i></span>
			</button>
			<button ref="otherSettingsButton" v-tooltip="i18n.ts.other" class="_button" :class="$style.headerRightItem" @click="showOtherSettings"><i class="ti ti-dots"></i></button>
			<button ref="submitButtonEl" v-click-anime class="_button" :class="$style.submit" :disabled="!canPost" data-cy-open-post-form-submit @click="post">
				<div :class="$style.submitInner">
					<template v-if="posted"></template>
					<template v-else-if="posting"><MkEllipsis/></template>
					<template v-else>{{ submitText }}</template>
					<i style="margin-left: 6px;" :class="submitIcon"></i>
				</div>
			</button>
		</div>
	</header>
	<MkNoteSimple v-if="replyTargetNote" :class="$style.targetNote" :note="replyTargetNote"/>
	<MkNoteSimple v-if="renoteTargetNote" :class="$style.targetNote" :note="renoteTargetNote"/>
	<div v-if="quoteId" :class="$style.withQuote"><i class="ti ti-quote"></i> {{ i18n.ts.quoteAttached }}<button @click="quoteId = null"><i class="ti ti-x"></i></button></div>
	<!-- DMの宛先表示部分を修正（自分のみ投稿の場合は非表示） -->
	<div v-if="visibility === 'specified' && (visibleUsers.length > 0 || isDmIntent)" :class="$style.toSpecified">
		<span style="margin-right: 8px;">{{ i18n.ts.recipient }}</span>
		<div :class="$style.visibleUsers">
			<span v-for="u in visibleUsers" :key="u.id" :class="$style.visibleUser">
				<MkAcct :user="u"/>
				<button class="_button" style="padding: 4px 8px;" @click="removeVisibleUser(u)"><i class="ti ti-x"></i></button>
			</span>
			<button class="_buttonPrimary" style="padding: 4px; border-radius: 8px;" @click="addVisibleUser"><i class="ti ti-plus ti-fw"></i></button>
		</div>
	</div>
	<MkInfo v-if="!store.r.tips.value.postForm" :class="$style.showHowToUse" closable @close="closeTip('postForm')">
		<button class="_textButton" @click="showTour">{{ i18n.ts._postForm.showHowToUse }}</button>
	</MkInfo>
	<MkInfo v-if="scheduledAt != null" :class="$style.scheduledAt">
		<I18n :src="i18n.ts.scheduleToPostOnX" tag="span">
			<template #x>
				<MkTime :time="scheduledAt" :mode="'detail'" style="font-weight: bold;"/>
			</template>
		</I18n> - <button class="_textButton" @click="cancelSchedule()">{{ i18n.ts.cancel }}</button>
	</MkInfo>
	<MkInfo v-if="hasNotSpecifiedMentions" warn :class="$style.hasNotSpecifiedMentions">{{ i18n.ts.notSpecifiedMentionWarning }} - <button class="_textButton" @click="addMissingMention()">{{ i18n.ts.add }}</button></MkInfo>
	<div v-show="useCw" :class="$style.cwOuter">
		<input ref="cwInputEl" v-model="cw" :class="$style.cw" :placeholder="i18n.ts.annotation" @keydown="onKeydown" @keyup="onKeyup" @compositionend="onCompositionEnd">
		<div v-if="maxCwTextLength - cwTextLength < 20" :class="['_acrylic', $style.cwTextCount, { [$style.cwTextOver]: cwTextLength > maxCwTextLength }]">{{ maxCwTextLength - cwTextLength }}</div>
	</div>
	<div :class="[$style.textOuter, { [$style.withCw]: useCw }]">
		<div v-if="targetChannel" :class="$style.colorBar" :style="{ background: targetChannel.color }"></div>
		<textarea ref="textareaEl" v-model="text" :class="[$style.text]" :disabled="posting || posted" :readonly="textAreaReadOnly" :placeholder="placeholder" data-cy-post-form-text @keydown="onKeydown" @keyup="onKeyup" @paste="onPaste" @compositionupdate="onCompositionUpdate" @compositionend="onCompositionEnd"/>
		<div v-if="maxTextLength - textLength < 100" :class="['_acrylic', $style.textCount, { [$style.textOver]: textLength > maxTextLength }]">{{ maxTextLength - textLength }}</div>
	</div>
	<input v-show="withHashtags" ref="hashtagsInputEl" v-model="hashtags" :class="$style.hashtags" :placeholder="i18n.ts.hashtags" list="hashtags">
	<XPostFormAttaches v-model="files" @detach="detachFile" @changeSensitive="updateFileSensitive" @changeName="updateFileName"/>
	<div v-if="uploader.items.value.length > 0" style="padding: 12px;">
		<MkTip k="postFormUploader">
			{{ i18n.ts._postForm.uploaderTip }}
		</MkTip>
		<MkUploaderItems :items="uploader.items.value" @showMenu="(item, ev) => showPerUploadItemMenu(item, ev)" @showMenuViaContextmenu="(item, ev) => showPerUploadItemMenuViaContextmenu(item, ev)"/>
	</div>
	<MkPollEditor v-if="poll" v-model="poll" @destroyed="poll = null"/>
	<MkDeleteScheduleEditor v-if="scheduledNoteDelete" v-model="scheduledNoteDelete" @destroyed="scheduledNoteDelete = null"/>
	<MkScheduleEditor v-if="scheduleNote" v-model="scheduleNote" :scheduledDelete="scheduledNoteDelete" @destroyed="scheduleNote = null"/>
	<MkNotePreview v-if="showPreview" :class="$style.preview" :text="text" :files="files" :poll="poll ?? undefined" :useCw="useCw" :cw="cw" :user="postAccount ?? $i"/>
	<div v-if="showingOptions" style="padding: 8px 16px;">
	</div>
	<footer ref="footerEl" :class="$style.footer">
		<div :class="$style.footerLeft">
			<template v-for="item in prefer.s.postFormActions">
				<button
					v-if="bottomItemDef[item] && bottomItemActionDef[item] && !bottomItemActionDef[item].hide"
					:key="item"
					v-tooltip="bottomItemDef[item].title"
					class="_button"
					:class="[$style.footerButton, { [$style.footerButtonActive]: bottomItemActionDef[item].active }]"
					v-on="bottomItemActionDef[item].action ? { click: bottomItemActionDef[item].action } : {}"
				>
					<i class="ti" :class="bottomItemDef[item].icon"></i>
				</button>
			</template>
		</div>
		<div :class="$style.footerRight">
			<button v-if="prefer.r.showPostFormSubButtons.value" v-tooltip="i18n.ts.postFormButtons" class="_button" :class="$style.footerButton" @click="openPostFormSettings"><i class="ti ti-settings"></i></button>
		</div>
	</footer>
	<datalist id="hashtags">
		<option v-for="hashtag in recentHashtags" :key="hashtag" :value="hashtag"/>
	</datalist>
</div>
</template>

<script lang="ts" setup>
import { inject, watch, nextTick, onMounted, defineAsyncComponent, provide, shallowRef, ref, computed, useTemplateRef, reactive, onUnmounted } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import insertTextAtCursor from 'insert-text-at-cursor';
import { toASCII } from 'punycode/';
import { host, url } from '@@/js/config.js';
import MkUploaderItems from './MkUploaderItems.vue';
import type { MenuItem } from '@/types/menu.js';
import type { ShallowRef } from 'vue';
import type { PostFormProps } from '@/types/post-form.js';
import type { PollEditorModelValue } from '@/components/MkPollEditor.vue';
import type { DeleteScheduleEditorModelValue } from '@/components/MkDeleteScheduleEditor.vue';
import type { UploaderItem } from '@/composables/use-uploader.js';
import MkNotePreview from '@/components/MkNotePreview.vue';
import XPostFormAttaches from '@/components/MkPostFormAttaches.vue';
import XTextCounter from '@/components/MkPostForm.TextCounter.vue';
import MkPollEditor from '@/components/MkPollEditor.vue';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkDeleteScheduleEditor from '@/components/MkDeleteScheduleEditor.vue';
import { erase, unique } from '@/utility/array.js';
import { extractMentions } from '@/utility/extract-mentions.js';
import { formatTimeString } from '@/utility/format-time-string.js';
import { Autocomplete } from '@/utility/autocomplete.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { chooseDriveFile } from '@/utility/drive.js';
import { store } from '@/store.js';
import MkInfo from '@/components/MkInfo.vue';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { ensureSignin, notesCount, incNotesCount } from '@/i.js';
import { getAccounts, getAccountMenu } from '@/accounts.js';
import { deepClone } from '@/utility/clone.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { miLocalStorage } from '@/local-storage.js';
import { claimAchievement } from '@/utility/achievements.js';
import { emojiPicker } from '@/utility/emoji-picker.js';
import { mfmFunctionPicker } from '@/utility/mfm-function-picker.js';
import { bottomItemDef } from '@/utility/post-form.js';
import MkScheduleEditor from '@/components/MkScheduleEditor.vue';
import { prefer } from '@/preferences.js';
import { getPluginHandlers } from '@/plugin.js';
import { DI } from '@/di.js';
import { isPrivateNoteInReplyChain } from '@/utility/private-note.js';
import { globalEvents } from '@/events.js';
import { checkDragDataType, getDragData } from '@/drag-and-drop.js';
import { useUploader } from '@/composables/use-uploader.js';
import { startTour } from '@/utility/tour.js';
import { closeTip } from '@/tips.js';

const $i = ensureSignin();

const modal = inject(DI.inModal, false);

const props = withDefaults(defineProps<PostFormProps & {
	fixed?: boolean;
	autofocus?: boolean;
	freezeAfterPosted?: boolean;
	mock?: boolean;
	isInYamiTimeline?: boolean;
	isInNormalTimeline?: boolean;
	initialDmIntent?: boolean;
}>(), {
	initialVisibleUsers: () => [],
	autofocus: true,
	mock: false,
	initialLocalOnly: undefined,
	isInYamiTimeline: false,
	isInNormalTimeline: false,
	initialDmIntent: undefined,
});

provide(DI.mock, props.mock);

const emit = defineEmits<{
	(ev: 'posted'): void;
	(ev: 'cancel'): void;
	(ev: 'esc'): void;

	// Mock用
	(ev: 'fileChangeSensitive', fileId: string, to: boolean): void;
}>();

const textareaEl = useTemplateRef('textareaEl');
const cwInputEl = useTemplateRef('cwInputEl');
const hashtagsInputEl = useTemplateRef('hashtagsInputEl');
const visibilityButton = useTemplateRef('visibilityButton');
const otherSettingsButton = useTemplateRef('otherSettingsButton');
const accountMenuEl = useTemplateRef('accountMenuEl');
const footerEl = useTemplateRef('footerEl');
const submitButtonEl = useTemplateRef('submitButtonEl');

const posting = ref(false);
const posted = ref(false);
const text = ref(props.initialText ?? '');
const files = ref(props.initialFiles ?? []);
const poll = ref<PollEditorModelValue | null>(null);
// フォームの初期値を取得する関数
const getInitialScheduledDelete = () => {
	return prefer.s.defaultScheduledNoteDelete
		? {
			deleteAt: null,
			deleteAfter: prefer.s.defaultScheduledNoteDeleteTime,
			isValid: true,
		}
		: null;
};
// 初期化
const scheduledNoteDelete = ref<DeleteScheduleEditorModelValue | null>(getInitialScheduledDelete());

// まずyamiNoteFederationEnabledを定義
const yamiNoteFederationEnabled = computed(() => {
	return instance.yamiNoteFederationEnabled === true;
});
// 次にisNoteInYamiModeを定義
const isNoteInYamiMode = ref(
	(props.reply?.isNoteInYamiMode || props.renote?.isNoteInYamiMode)
		? true
		: ($i.policies.canYamiNote
			? (prefer.s.rememberNoteVisibility ? prefer.s.isNoteInYamiMode : prefer.s.defaultIsNoteInYamiMode)
			: false),
);
// そしてshouldLocalOnlyを定義
const shouldLocalOnly = computed<boolean>(() => {
	// 管理者が連合を禁止している場合は連合なし強制
	if ($i.policies.canFederateNote === false) {
		return true;
	}
	// やみノートで連合が無効の場合も連合なし強制
	return isNoteInYamiMode.value && !yamiNoteFederationEnabled.value;
});
// 最後にlocalOnlyを定義
const localOnly = ref(
	shouldLocalOnly.value
		? true
		: (props.initialLocalOnly ?? (prefer.s.rememberNoteVisibility ? store.s.localOnly : prefer.s.defaultNoteLocalOnly)),
);

// 固定フォームの場合はタイムラインタイプを監視して即時反映
watch(
	[() => props.isInYamiTimeline, () => props.isInNormalTimeline],
	([isInYamiTimeline, isInNormalTimeline]) => {
		// タイムラインに埋め込まれている場合のみ強制適用（ウィジェットは除外）
		if (props.fixed && (isInYamiTimeline || isInNormalTimeline)) {
			isNoteInYamiMode.value = !!isInYamiTimeline;
		}
	},
	{ immediate: true },
);

// 管理者がやみノート連合を無効にしている場合は、やみノートを連合なし投稿に強制
watch(() => yamiNoteFederationEnabled.value, () => {
	if (shouldLocalOnly.value) {
		localOnly.value = true;
	}
}, { immediate: true });

// やみノートモードの変更も監視して連合設定を強制
watch(() => isNoteInYamiMode.value, () => {
	if (shouldLocalOnly.value) {
		localOnly.value = true;
	}
}, { immediate: true });

// 親投稿がやみノートかどうかの判定を計算プロパティに
const parentIsYamiNote = computed(() => {
	return (props.reply?.isNoteInYamiMode || props.renote?.isNoteInYamiMode) ?? false;
});
// デフォルト設定の変更を監視
watch(() => prefer.s.defaultScheduledNoteDelete, (newValue) => {
	scheduledNoteDelete.value = getInitialScheduledDelete();
});
// フォームがリセットされたときに初期化（新規投稿時）
watch(() => props.initialNote, () => {
	scheduledNoteDelete.value = getInitialScheduledDelete();
});
const useCw = ref<boolean>(!!props.initialCw);
const showPreview = ref(store.s.showPreview);
watch(showPreview, () => store.set('showPreview', showPreview.value));
const showAddMfmFunction = ref(prefer.s.enableQuickAddMfmFunction);
watch(showAddMfmFunction, () => prefer.commit('enableQuickAddMfmFunction', showAddMfmFunction.value));
const cw = ref<string | null>(props.initialCw ?? null);
const visibility = ref(props.initialVisibility ?? (prefer.s.rememberNoteVisibility ? store.s.visibility : prefer.s.defaultNoteVisibility));
const visibleUsers = ref<Misskey.entities.UserDetailed[]>([]);
if (props.initialVisibleUsers) {
	props.initialVisibleUsers.forEach(u => pushVisibleUser(u));
}
const reactionAcceptance = ref(store.s.reactionAcceptance);
const scheduledAt = ref<number | null>(null);
const draghover = ref(false);
const quoteId = ref<string | null>(null);
const hasNotSpecifiedMentions = ref(false);
const recentHashtags = ref(JSON.parse(miLocalStorage.getItem('hashtags') ?? '[]'));
const imeText = ref('');
const showingOptions = ref(false);
const textAreaReadOnly = ref(false);
const scheduleNote = ref<{
	scheduledAt: number | null;
	isValid?: boolean;
} | null>(null);
const justEndedComposition = ref(false);
const renoteTargetNote: ShallowRef<PostFormProps['renote'] | null> = shallowRef(props.renote);
const replyTargetNote: ShallowRef<PostFormProps['reply'] | null> = shallowRef(props.reply);
const targetChannel = shallowRef<PostFormProps['channel']>(props.channel);

const serverDraftId = ref<string | null>(null);
const postFormActions = getPluginHandlers('post_form_action');

const uploader = useUploader({
	multiple: true,
});

onUnmounted(() => {
	uploader.dispose();
});

uploader.events.on('itemUploaded', ctx => {
	files.value.push(ctx.item.uploaded!);
	uploader.removeItem(ctx.item);
});

const draftKey = computed((): string => {
	let key = targetChannel.value ? `channel:${targetChannel.value.id}` : '';

	if (renoteTargetNote.value) {
		key += `renote:${renoteTargetNote.value.id}`;
	} else if (replyTargetNote.value) {
		key += `reply:${replyTargetNote.value.id}`;
	} else {
		key += `note:${$i.id}`;
	}

	return key;
});

const placeholder = computed((): string => {
	if (props.renote) {
		return i18n.ts._postForm.quotePlaceholder;
	} else if (replyTargetNote.value) {
		return i18n.ts._postForm.replyPlaceholder;
	} else if (targetChannel.value) {
		return i18n.ts._postForm.channelPlaceholder;
	} else {
		const xs = [
			i18n.ts._postForm._placeholders.a,
			i18n.ts._postForm._placeholders.b,
			i18n.ts._postForm._placeholders.c,
			i18n.ts._postForm._placeholders.d,
			i18n.ts._postForm._placeholders.e,
			i18n.ts._postForm._placeholders.f,
		];
		return xs[Math.floor(Math.random() * xs.length)];
	}
});

const submitText = computed((): string => {
	return scheduledAt.value != null
		? i18n.ts.schedule
		: props.renote
			? i18n.ts.quote
			: replyTargetNote.value
				? i18n.ts.reply
				: i18n.ts.note;
});

const submitIcon = computed((): string => {
	return posted.value ? 'ti ti-check' : scheduledAt.value != null ? 'ti ti-calendar-time' : replyTargetNote.value ? 'ti ti-arrow-back-up' : renoteTargetNote.value ? 'ti ti-quote' : 'ti ti-send';
});

const textLength = computed((): number => {
	return (text.value + imeText.value).length;
});

const maxTextLength = computed((): number => {
	return instance ? instance.maxNoteTextLength : 1000;
});

const cwTextLength = computed((): number => {
	return cw.value?.length ?? 0;
});

const maxCwTextLength = 100;

const canPost = computed((): boolean => {
	return !props.mock && !posting.value && !posted.value && !uploader.uploading.value && (uploader.items.value.length === 0 || uploader.readyForUpload.value) &&
		(scheduledNoteDelete.value ? scheduledNoteDelete.value.isValid : true) &&
		(scheduleNote.value ? (scheduleNote.value.isValid ?? true) : true) &&
		(!scheduleNote.value || !scheduledNoteDelete.value ||
			!scheduleNote.value.scheduledAt || !scheduledNoteDelete.value.deleteAt ||
			scheduledNoteDelete.value.deleteAt > scheduleNote.value.scheduledAt) &&
		(
			1 <= textLength.value ||
			1 <= files.value.length ||
			1 <= uploader.items.value.length ||
			poll.value != null ||
			props.renote != null ||
			quoteId.value != null
		) &&
		(textLength.value <= maxTextLength.value) &&
		(
			useCw.value ?
				(
					cw.value != null && cw.value.trim() !== '' &&
					cwTextLength.value <= maxCwTextLength
				) : true
		) &&
		(files.value.length <= 16) &&
		(!poll.value || poll.value.choices.length >= 2);
});

// cannot save pure renote as draft
const canSaveAsServerDraft = computed((): boolean => {
	return canPost.value && (textLength.value > 0 || files.value.length > 0 || poll.value != null);
});

const withHashtags = computed(store.makeGetterSetter('postFormWithHashtags'));
const hashtags = computed(store.makeGetterSetter('postFormHashtags'));

const bottomItemActionDef: Record<keyof typeof bottomItemDef, {
	hide?: boolean;
	active?: any;
	action?: any;
}> = reactive({
	attachFile: {
		action: chooseFileFrom,
	},
	poll: {
		active: poll,
		action: togglePoll,
	},
	scheduledNoteDelete: {
		active: scheduledNoteDelete,
		action: toggleScheduledNoteDelete,
	},
	useCw: {
		active: useCw,
		action: () => useCw.value = !useCw.value,
	},
	mention: {
		action: insertMention,
	},
	hashtags: {
		active: withHashtags,
		action: () => withHashtags.value = !withHashtags.value,
	},
	plugins: {
		hide: postFormActions.length === 0,
		action: showActions,
	},
	emoji: {
		action: insertEmoji,
	},
	addMfmFunction: {
		hide: computed(() => !showAddMfmFunction.value),
		action: insertMfmFunction,
	},
	clearPost: {
		action: clear,
	},
});

// 新しい状態変数を追加
const isDmIntent = ref(props.initialDmIntent ??
  (visibility.value === 'specified' ? prefer.s.defaultIsDmIntent : false));

// 自分のみ投稿の判定を改善
const isPrivateNote = computed(() => {
	// 基本的な自分のみ投稿
	if (visibility.value === 'specified' && visibleUsers.value.length === 0 && !isDmIntent.value) {
		return true;
	}

	// 自分のみノートへのリプライ
	if (visibility.value === 'specified' &&
        visibleUsers.value.length === 1 &&
        visibleUsers.value[0].id === $i.id &&
        props.reply) {
		return isPrivateNoteInReplyChain(props.reply);
	}

	return false;
});

// リプライ先の変更を監視して自動的にプライベート設定を適用
watch(() => props.reply, (newReply) => {
	if (newReply && isPrivateNoteInReplyChain(newReply)) {
		visibility.value = 'specified';
		visibleUsers.value = []; // 自分のみ閲覧可能に設定
	}
}, { immediate: true });

// 表示用の公開範囲
const displayVisibility = computed(() => {
	if (isPrivateNote.value) {
		return 'private';
	}
	return visibility.value;
});

// チャンネル名の取得
const targetChannelName = computed(() => {
	return targetChannel.value?.name ?? '';
});

// 連合ボタンの無効化条件
const isFederationToggleDisabled = computed(() => {
	return props.channel != null ||
    (visibility.value === 'specified' && (visibleUsers.value.length > 0 || isDmIntent.value)) || // DMの場合のみ無効化
    isPrivateNote.value || // privateの場合は連合なし強制
    $i.policies.canFederateNote === false ||
    (isNoteInYamiMode.value && !yamiNoteFederationEnabled.value);
});

// 公開範囲に応じてlocalOnlyを自動設定
watch([visibility, visibleUsers], () => {
	if (isPrivateNote.value) {
		// privateの場合は連合なし強制
		localOnly.value = true;
	} else if (visibility.value === 'specified' && visibleUsers.value.length > 0) {
		// 宛先ありDMの場合は連合あり強制
		// （localOnly=trueの場合はDMボタンが無効化されるので、ここには到達しない）
		localOnly.value = false;
	}
}, { deep: true, immediate: true });

watch(text, () => {
	checkMissingMention();
}, { immediate: true });

watch(visibility, () => {
	checkMissingMention();
}, { immediate: true });

watch(visibleUsers, () => {
	checkMissingMention();
}, {
	deep: true,
});

// 宛先が変更されたらDM意図フラグをリセット
watch(visibleUsers, (newUsers) => {
	// 宛先が明示的に変更されたらDM意図状態を解除
	if (newUsers.length > 0) {
		isDmIntent.value = false;
	}
}, { deep: true });

if (props.mention) {
	text.value = props.mention.host ? `@${props.mention.username}@${toASCII(props.mention.host)}` : `@${props.mention.username}`;
	text.value += ' ';
}

if (replyTargetNote.value && (replyTargetNote.value.user.username !== $i.username || (replyTargetNote.value.user.host != null && replyTargetNote.value.user.host !== host))) {
	text.value = `@${replyTargetNote.value.user.username}${replyTargetNote.value.user.host != null ? '@' + toASCII(replyTargetNote.value.user.host) : ''} `;
}

if (replyTargetNote.value && replyTargetNote.value.text != null) {
	const ast = mfm.parse(replyTargetNote.value.text);
	const otherHost = replyTargetNote.value.user.host;

	for (const x of extractMentions(ast)) {
		const mention = x.host ?
			`@${x.username}@${toASCII(x.host)}` :
			(otherHost == null || otherHost === host) ?
				`@${x.username}` :
				`@${x.username}@${toASCII(otherHost)}`;

		// 自分は除外
		if ($i.username === x.username && (x.host == null || x.host === host)) continue;

		// 重複は除外
		if (text.value.includes(`${mention} `)) continue;

		text.value += `${mention} `;
	}
}

if ($i.isSilenced && visibility.value === 'public') {
	visibility.value = 'home';
}

if (targetChannel.value) {
	visibility.value = 'public';
	localOnly.value = true; // TODO: チャンネルが連合するようになった折には消す
}

// 公開以外へのリプライ時は元の公開範囲を引き継ぐ
if (replyTargetNote.value && ['home', 'followers', 'specified'].includes(replyTargetNote.value.visibility)) {
	if (replyTargetNote.value.visibility === 'home' && visibility.value === 'followers') {
		visibility.value = 'followers';
	} else if (['home', 'followers'].includes(replyTargetNote.value.visibility) && visibility.value === 'specified') {
		visibility.value = 'specified';
	} else {
		visibility.value = replyTargetNote.value.visibility;
	}

	if (visibility.value === 'specified') {
		if (replyTargetNote.value.visibleUserIds) {
			misskeyApi('users/show', {
				userIds: replyTargetNote.value.visibleUserIds.filter(uid => uid !== $i.id && uid !== replyTargetNote.value?.userId),
			}).then(users => {
				users.forEach(u => pushVisibleUser(u));
			});
		}

		if (replyTargetNote.value.userId !== $i.id) {
			misskeyApi('users/show', { userId: replyTargetNote.value.userId }).then(user => {
				pushVisibleUser(user);
			});
		}
	}
}

if (props.specified) {
	visibility.value = 'specified';
	pushVisibleUser(props.specified);
}

// keep cw when reply
if (prefer.s.keepCw && replyTargetNote.value && replyTargetNote.value.cw) {
	useCw.value = true;
	cw.value = replyTargetNote.value.cw;
}

function watchForDraft() {
	watch(text, () => saveDraft());
	watch(useCw, () => saveDraft());
	watch(cw, () => saveDraft());
	watch(poll, () => saveDraft());
	watch(scheduledNoteDelete, () => saveDraft());
	watch(files, () => saveDraft(), { deep: true });
	watch(visibility, () => saveDraft());
	watch(localOnly, () => saveDraft());
	watch(quoteId, () => saveDraft());
	watch(reactionAcceptance, () => saveDraft());
	watch(isNoteInYamiMode, () => saveDraft()); // やみノート状態も監視
	watch(scheduledAt, () => saveDraft());
}

function checkMissingMention() {
	if (visibility.value === 'specified') {
		const ast = mfm.parse(text.value);

		for (const x of extractMentions(ast)) {
			if (!visibleUsers.value.some(u => (u.username === x.username) && (u.host === x.host))) {
				hasNotSpecifiedMentions.value = true;
				return;
			}
		}
	}
	hasNotSpecifiedMentions.value = false;
}

function addMissingMention() {
	const ast = mfm.parse(text.value);

	for (const x of extractMentions(ast)) {
		if (!visibleUsers.value.some(u => (u.username === x.username) && (u.host === x.host))) {
			misskeyApi('users/show', { username: x.username, host: x.host }).then(user => {
				pushVisibleUser(user);
			});
		}
	}
}

function togglePoll() {
	if (poll.value) {
		poll.value = null;
	} else {
		poll.value = {
			choices: ['', ''],
			multiple: false,
			expiresAt: null,
			expiredAfter: null,
		};
	}
}

function toggleScheduledNoteDelete() {
	if (scheduledNoteDelete.value) {
		scheduledNoteDelete.value = null;
	} else {
		scheduledNoteDelete.value = {
			deleteAt: null,
			deleteAfter: null,
			isValid: true,
		};
	}
}

function focus() {
	if (textareaEl.value) {
		textareaEl.value.focus();
		textareaEl.value.setSelectionRange(textareaEl.value.value.length, textareaEl.value.value.length);
	}
}

function chooseFileFrom(ev: MouseEvent) {
	const items = [{
		text: i18n.ts.upload,
		icon: 'ti ti-upload',
		action: () => {
			chooseFileFromPc(ev);
		},
	}, {
		text: i18n.ts.fromDrive,
		icon: 'ti ti-cloud-download',
		action: () => {
			chooseFileFromDrive(ev);
		},
	}];

	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

function chooseFileFromPc(ev: MouseEvent) {
	if (props.mock) return;

	os.chooseFileFromPc({ multiple: true }).then(files => {
		if (files.length === 0) return;
		uploader.addFiles(files);
	});
}

function chooseFileFromDrive(ev: MouseEvent) {
	if (props.mock) return;

	chooseDriveFile({ multiple: true }).then(driveFiles => {
		files.value.push(...driveFiles);
	});
}

function detachFile(id) {
	files.value = files.value.filter(x => x.id !== id);
}

function updateFileSensitive(file, sensitive) {
	if (props.mock) {
		emit('fileChangeSensitive', file.id, sensitive);
	}
	files.value[files.value.findIndex(x => x.id === file.id)].isSensitive = sensitive;
}

function updateFileName(file, name) {
	files.value[files.value.findIndex(x => x.id === file.id)].name = name;
}

function setVisibility() {
	if (targetChannel.value) {
		visibility.value = 'public';
		localOnly.value = true; // TODO: チャンネルが連合するようになった折には消す
		return;
	}

	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkVisibilityPicker.vue')), {
		currentVisibility: visibility.value,
		currentVisibleUsers: visibleUsers.value,
		isSilenced: $i.isSilenced,
		localOnly: localOnly.value,
		anchorElement: visibilityButton.value,
		isNoteInYamiMode: isNoteInYamiMode.value,
		isDmIntent: isDmIntent.value,
		...(replyTargetNote.value ? { isReplyVisibilitySpecified: replyTargetNote.value.visibility === 'specified' } : {}),
	}, {
		changeVisibility: v => {
			visibility.value = v;
			if (prefer.s.rememberNoteVisibility) {
				store.set('visibility', visibility.value);
			}
		},
		changeVisibleUsers: users => {
			visibleUsers.value = users;
		},
		changeDmIntent: intent => {
			isDmIntent.value = intent;
		},
		closed: () => dispose(),
	});
}

// ローカルオンリー切り替え関数を修正
async function toggleLocalOnly() {
	if (targetChannel.value) {
		visibility.value = 'public';
		localOnly.value = true;
		return;
	}

	// 自分のみ投稿の場合は連合なし固定
	if (isPrivateNote.value) {
		localOnly.value = true;
		return;
	}

	// 普通のDM（宛先あり）の場合は連合あり固定
	if (visibility.value === 'specified' && visibleUsers.value.length > 0) {
		localOnly.value = false;
		return;
	}

	// 管理者がやみノート連合を無効にしている場合は、やみノートを連合なし投稿に強制
	if (shouldLocalOnly.value) {
		localOnly.value = true;
		return;
	}

	// 既存の処理（通常のDMは連合ありのまま）
	const neverShowInfo = miLocalStorage.getItem('neverShowLocalOnlyInfo');

	if (!localOnly.value && neverShowInfo !== 'true') {
		const confirm = await os.actions({
			type: 'question',
			title: i18n.ts.disableFederationConfirm,
			text: i18n.ts.disableFederationConfirmWarn,
			actions: [
				{
					value: 'yes' as const,
					text: i18n.ts.disableFederationOk,
					primary: true,
				},
				{
					value: 'neverShow' as const,
					text: `${i18n.ts.disableFederationOk} (${i18n.ts.neverShow})`,
					danger: true,
				},
				{
					value: 'no' as const,
					text: i18n.ts.cancel,
				},
			],
		});
		if (confirm.canceled) return;
		if (confirm.result === 'no') return;

		if (confirm.result === 'neverShow') {
			miLocalStorage.setItem('neverShowLocalOnlyInfo', 'true');
		}
	}

	localOnly.value = !localOnly.value;
	if (prefer.s.rememberNoteVisibility) {
		store.set('localOnly', localOnly.value);
	}
}

async function toggleReactionAcceptance() {
	const select = await os.select({
		title: i18n.ts.reactionAcceptance,
		items: [
			{ value: null, label: i18n.ts.all },
			{ value: 'likeOnlyForRemote' as const, label: i18n.ts.likeOnlyForRemote },
			{ value: 'nonSensitiveOnly' as const, label: i18n.ts.nonSensitiveOnly },
			{ value: 'nonSensitiveOnlyForLocalLikeOnlyForRemote' as const, label: i18n.ts.nonSensitiveOnlyForLocalLikeOnlyForRemote },
			{ value: 'likeOnly' as const, label: i18n.ts.likeOnly },
		],
		default: reactionAcceptance.value,
	});
	if (select.canceled) return;
	reactionAcceptance.value = select.result;
}

//#region その他の設定メニューpopup
function showOtherSettings() {
	let reactionAcceptanceIcon = 'ti ti-icons';

	if (reactionAcceptance.value === 'likeOnly') {
		reactionAcceptanceIcon = 'ti ti-heart _love';
	} else if (reactionAcceptance.value === 'likeOnlyForRemote') {
		reactionAcceptanceIcon = 'ti ti-heart-plus';
	}

	const menuItems = [{
		type: 'component',
		component: XTextCounter,
		props: {
			textLength: textLength,
		},
	}, { type: 'divider' }, {
		icon: reactionAcceptanceIcon,
		text: i18n.ts.reactionAcceptance,
		action: () => {
			toggleReactionAcceptance();
		},
	}, { type: 'divider' }, {
		type: 'button',
		text: i18n.ts._drafts.saveToDraft,
		icon: 'ti ti-cloud-upload',
		action: async () => {
			if (!canSaveAsServerDraft.value) {
				return os.alert({
					type: 'error',
					text: i18n.ts._drafts.cannotCreateDraft,
				});
			}
			saveServerDraft();
		},
	}, ...($i.policies.scheduledNoteLimit > 0 ? [{
		icon: 'ti ti-calendar-time',
		text: i18n.ts.schedulePost + '...',
		action: () => {
			schedule();
		},
	}] : []), { type: 'divider' }, {
		type: 'switch',
		icon: 'ti ti-eye',
		text: i18n.ts.preview,
		ref: showPreview,
	}, {
		icon: 'ti ti-trash',
		text: i18n.ts.reset,
		danger: true,
		action: async () => {
			if (props.mock) return;
			const { canceled } = await os.confirm({
				type: 'question',
				text: i18n.ts.resetAreYouSure,
			});
			if (canceled) return;
			clear();
		},
	}] satisfies MenuItem[];

	os.popupMenu(menuItems, otherSettingsButton.value);
}

function openPostFormSettings() {
	// 投稿フォームボタン設定画面へ遷移
	window.location.href = '/settings/postform-buttons';
}
//#endregion

function pushVisibleUser(user: Misskey.entities.UserDetailed) {
	if (!visibleUsers.value.some(u => u.username === user.username && u.host === user.host)) {
		visibleUsers.value.push(user);
	}
}

function addVisibleUser() {
	os.selectUser().then(user => {
		pushVisibleUser(user);
		// 宛先が追加されたらDMなので、やみノートでない限り連合ありに戻す
		if (localOnly.value && !isNoteInYamiMode.value) {
			localOnly.value = false;
		}

		if (!text.value.toLowerCase().includes(`@${user.username.toLowerCase()}`)) {
			text.value = `@${Misskey.acct.toString(user)} ${text.value}`;
		}
	});
}

function removeVisibleUser(user) {
	visibleUsers.value = erase(user, visibleUsers.value);
	// 宛先を全て削除したらプライベートノートになるが、ユーザーがDMを意図していることを考慮
	if (visibleUsers.value.length === 0) {
		isDmIntent.value = true; // 宛先を削除してもDM意図を維持
	}
}

function clear() {
	text.value = '';
	files.value = [];
	poll.value = null;
	quoteId.value = null;
	scheduleNote.value = null;
	scheduledAt.value = null;
}

function onKeydown(ev: KeyboardEvent) {
	if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey) && canPost.value) post();

	// justEndedComposition.value is for Safari, which keyDown occurs after compositionend.
	// ev.isComposing is for another browsers.
	if (ev.key === 'Escape' && !justEndedComposition.value && !ev.isComposing) emit('esc');
}

function onKeyup(ev: KeyboardEvent) {
	justEndedComposition.value = false;
}

function onCompositionUpdate(ev: CompositionEvent) {
	imeText.value = ev.data;
}

function onCompositionEnd(ev: CompositionEvent) {
	imeText.value = '';
	justEndedComposition.value = true;
}

const pastedFileName = 'yyyy-MM-dd HH-mm-ss [{{number}}]';

async function onPaste(ev: ClipboardEvent) {
	if (props.mock) return;
	if (!ev.clipboardData) return;

	let pastedFiles: File[] = [];
	for (const { item, i } of Array.from(ev.clipboardData.items, (data, x) => ({ item: data, i: x }))) {
		if (item.kind === 'file') {
			const file = item.getAsFile();
			if (!file) continue;
			const lio = file.name.lastIndexOf('.');
			const ext = lio >= 0 ? file.name.slice(lio) : '';
			const formattedName = `${formatTimeString(new Date(file.lastModified), pastedFileName).replace(/{{number}}/g, `${i + 1}`)}${ext}`;
			const renamedFile = new File([file], formattedName, { type: file.type });
			pastedFiles.push(renamedFile);
		}
	}
	if (pastedFiles.length > 0) {
		ev.preventDefault();
		uploader.addFiles(pastedFiles);
		return;
	}

	const paste = ev.clipboardData.getData('text');

	if (!props.renote && !quoteId.value && paste.startsWith(url + '/notes/')) {
		ev.preventDefault();

		os.confirm({
			type: 'info',
			text: i18n.ts.quoteQuestion,
		}).then(({ canceled }) => {
			if (canceled) {
				insertTextAtCursor(textareaEl.value, paste);
				return;
			}

			quoteId.value = paste.substring(url.length).match(/^\/notes\/(.+?)\/?$/)?.[1] ?? null;
		});
	}

	if (paste.length > 1000) {
		ev.preventDefault();
		os.confirm({
			type: 'info',
			text: i18n.ts.attachAsFileQuestion,
		}).then(({ canceled }) => {
			if (canceled) {
				insertTextAtCursor(textareaEl.value, paste);
				return;
			}

			const fileName = formatTimeString(new Date(), pastedFileName).replace(/{{number}}/g, '0');
			const file = new File([paste], `${fileName}.txt`, { type: 'text/plain' });
			uploader.addFiles([file]);
		});
	}
}

function onDragover(ev) {
	if (!ev.dataTransfer.items[0]) return;
	const isFile = ev.dataTransfer.items[0].kind === 'file';
	if (isFile || checkDragDataType(ev, ['driveFiles'])) {
		ev.preventDefault();
		draghover.value = true;
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy':
			case 'copyLink':
			case 'copyMove':
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	}
}

function onDragenter() {
	draghover.value = true;
}

function onDragleave() {
	draghover.value = false;
}

function onDrop(ev: DragEvent): void {
	draghover.value = false;

	// ファイルだったら
	if (ev.dataTransfer && ev.dataTransfer.files.length > 0) {
		ev.preventDefault();
		uploader.addFiles(Array.from(ev.dataTransfer.files));
		return;
	}

	//#region ドライブのファイル
	{
		const droppedData = getDragData(ev, 'driveFiles');
		if (droppedData != null) {
			files.value.push(...droppedData);
			ev.preventDefault();
		}
	}
	//#endregion
}

function saveDraft() {
	if (props.instant || props.mock) return;

	const draftData = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}');

	draftData[draftKey.value] = {
		updatedAt: new Date(),
		data: {
			text: text.value,
			useCw: useCw.value,
			cw: cw.value,
			visibility: visibility.value,
			localOnly: localOnly.value,
			files: files.value,
			poll: poll.value,
			...( visibleUsers.value.length > 0 ? { visibleUserIds: visibleUsers.value.map(x => x.id) } : {}),
			quoteId: quoteId.value,
			reactionAcceptance: reactionAcceptance.value,
			scheduledNoteDelete: scheduledNoteDelete.value,
			scheduleNote: scheduleNote.value,
			isNoteInYamiMode: isNoteInYamiMode.value, // やみノート状態を保存
			scheduledAt: scheduledAt.value,
		},
	};

	miLocalStorage.setItem('drafts', JSON.stringify(draftData));
}

function deleteDraft() {
	const draftData = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}');

	delete draftData[draftKey.value];

	miLocalStorage.setItem('drafts', JSON.stringify(draftData));
}

async function saveServerDraft(options: {
	isActuallyScheduled?: boolean;
} = {}) {
	// Calculate deleteAt from deleteAfter if needed
	let deleteAt: number | null = null;
	if (scheduledNoteDelete.value) {
		if (scheduledNoteDelete.value.deleteAt) {
			deleteAt = scheduledNoteDelete.value.deleteAt;
		} else if (scheduledNoteDelete.value.deleteAfter) {
			// Convert relative time to absolute time
			const baseTime = options.isActuallyScheduled && scheduledAt.value ? scheduledAt.value : Date.now();
			deleteAt = baseTime + scheduledNoteDelete.value.deleteAfter;
		}
	}

	return await os.apiWithDialog(serverDraftId.value == null ? 'notes/drafts/create' : 'notes/drafts/update', {
		...(serverDraftId.value == null ? {} : { draftId: serverDraftId.value }),
		text: text.value,
		cw: useCw.value ? cw.value || null : null,
		visibility: visibility.value,
		localOnly: localOnly.value,
		hashtag: hashtags.value,
		fileIds: files.value.map(f => f.id),
		poll: poll.value,
		visibleUserIds: visibleUsers.value.map(x => x.id),
		renoteId: renoteTargetNote.value ? renoteTargetNote.value.id : quoteId.value ? quoteId.value : null,
		replyId: replyTargetNote.value ? replyTargetNote.value.id : null,
		channelId: targetChannel.value ? targetChannel.value.id : null,
		reactionAcceptance: reactionAcceptance.value,
		isNoteInYamiMode: isNoteInYamiMode.value, // やみノート状態をサーバー下書きにも保存
		scheduledAt: scheduledAt.value,
		isActuallyScheduled: options.isActuallyScheduled ?? false,
		deleteAt: deleteAt,
	});
}

function isAnnoying(text: string): boolean {
	return text.includes('$[x2') ||
		text.includes('$[x3') ||
		text.includes('$[x4') ||
		text.includes('$[scale') ||
		text.includes('$[position');
}

async function uploadFiles() {
	await uploader.upload();

	for (const uploadedItem of uploader.items.value.filter(x => x.uploaded != null)) {
		files.value.push(uploadedItem.uploaded!);
		uploader.removeItem(uploadedItem);
	}
}

async function post(ev?: MouseEvent) {
	if (ev) {
		const el = (ev.currentTarget ?? ev.target) as HTMLElement | null;

		if (el && prefer.s.animation) {
			const rect = el.getBoundingClientRect();
			const x = rect.left + (el.offsetWidth / 2);
			const y = rect.top + (el.offsetHeight / 2);
			const { dispose } = os.popup(MkRippleEffect, { x, y }, {
				end: () => dispose(),
			});
		}
	}

	if (scheduledAt.value != null) {
		if (uploader.items.value.some(x => x.uploaded == null)) {
			await uploadFiles();

			// アップロード失敗したものがあったら中止
			if (uploader.items.value.some(x => x.uploaded == null)) {
				return;
			}
		}

		await postAsScheduled();
		clear();
		return;
	}

	if (props.mock) return;

	if (visibility.value === 'public' && (
		(useCw.value && cw.value != null && cw.value.trim() !== '' && isAnnoying(cw.value)) || // CWが迷惑になる場合
		((!useCw.value || cw.value == null || cw.value.trim() === '') && text.value != null && text.value.trim() !== '' && isAnnoying(text.value)) // CWが無い かつ 本文が迷惑になる場合
	)) {
		const { canceled, result } = await os.actions({
			type: 'warning',
			text: i18n.ts.thisPostMayBeAnnoying,
			actions: [{
				value: 'home',
				text: i18n.ts.thisPostMayBeAnnoyingHome,
				primary: true,
			}, {
				value: 'cancel',
				text: i18n.ts.thisPostMayBeAnnoyingCancel,
			}, {
				value: 'ignore',
				text: i18n.ts.thisPostMayBeAnnoyingIgnore,
			}],
		});

		if (canceled) return;
		if (result === 'cancel') return;
		if (result === 'home') {
			visibility.value = 'home';
		}
	}

	if (uploader.items.value.some(x => x.uploaded == null)) {
		await uploadFiles();

		// アップロード失敗したものがあったら中止
		if (uploader.items.value.some(x => x.uploaded == null)) {
			return;
		}
	}

	let postData = {
		text: text.value === '' ? null : text.value,
		fileIds: files.value.length > 0 ? files.value.map(f => f.id) : undefined,
		replyId: replyTargetNote.value ? replyTargetNote.value.id : undefined,
		renoteId: renoteTargetNote.value ? renoteTargetNote.value.id : quoteId.value ? quoteId.value : undefined,
		channelId: targetChannel.value ? targetChannel.value.id : undefined,
		poll: poll.value,
		scheduledDelete: scheduledNoteDelete.value,
		cw: useCw.value ? cw.value ?? '' : null,
		localOnly: localOnly.value,
		visibility: visibility.value,
		visibleUserIds: visibility.value === 'specified' ? visibleUsers.value.map(u => u.id) : undefined,
		reactionAcceptance: reactionAcceptance.value,
		scheduleNote: scheduleNote.value ?? undefined,
		isNoteInYamiMode: isNoteInYamiMode.value, // やみノート状態を保存
	};

	if (withHashtags.value && hashtags.value && hashtags.value.trim() !== '') {
		const hashtags_ = hashtags.value.trim().split(' ').map(x => x.startsWith('#') ? x : '#' + x).join(' ');
		if (!postData.text) {
			postData.text = hashtags_;
		} else {
			const postTextLines = postData.text.split('\n');
			if (postTextLines[postTextLines.length - 1].trim() === '') {
				postTextLines[postTextLines.length - 1] += hashtags_;
			} else {
				postTextLines[postTextLines.length - 1] += ' ' + hashtags_;
			}
			postData.text = postTextLines.join('\n');
		}
	}

	// plugin
	const notePostInterruptors = getPluginHandlers('note_post_interruptor');
	if (notePostInterruptors.length > 0) {
		for (const interruptor of notePostInterruptors) {
			try {
				postData = await interruptor.handler(deepClone(postData) as any) as typeof postData;
			} catch (err) {
				console.error(err);
			}
		}
	}

	let token: string | undefined = undefined;

	if (postAccount.value) {
		const storedAccounts = await getAccounts();
		const storedAccount = storedAccounts.find(x => x.id === postAccount.value?.id);
		if (storedAccount && storedAccount.token != null) {
			token = storedAccount.token;
		} else {
			await os.alert({
				type: 'error',
				text: 'cannot find the token of the selected account.',
			});
			return;
		}
	}

	posting.value = true;
	misskeyApi('notes/create', postData, token).then((res) => {
		if (props.freezeAfterPosted) {
			posted.value = true;
		} else {
			clear();
		}

		globalEvents.emit('notePosted', res.createdNote);

		nextTick(() => {
			deleteDraft();
			emit('posted');
			if (postData.text && postData.text !== '') {
				const hashtags_ = mfm.parse(postData.text).map(x => x.type === 'hashtag' && x.props.hashtag).filter(x => x) as string[];
				const history = JSON.parse(miLocalStorage.getItem('hashtags') ?? '[]') as string[];
				miLocalStorage.setItem('hashtags', JSON.stringify(unique(hashtags_.concat(history))));
			}
			posting.value = false;
			postAccount.value = null;

			incNotesCount();
			if (notesCount === 1) {
				claimAchievement('notes1');
			}

			poll.value = null;

			const text = postData.text ?? '';
			const lowerCase = text.toLowerCase();
			if ((lowerCase.includes('love') || lowerCase.includes('❤')) && lowerCase.includes('misskey')) {
				claimAchievement('iLoveMisskey');
			}
			if ([
				'https://youtu.be/Efrlqw8ytg4',
				'https://www.youtube.com/watch?v=Efrlqw8ytg4',
				'https://m.youtube.com/watch?v=Efrlqw8ytg4',

				'https://youtu.be/XVCwzwxdHuA',
				'https://www.youtube.com/watch?v=XVCwzwxdHuA',
				'https://m.youtube.com/watch?v=XVCwzwxdHuA',

				'https://open.spotify.com/track/3Cuj0mZrlLoXx9nydNi7RB',
				'https://open.spotify.com/track/7anfcaNPQWlWCwyCHmZqNy',
				'https://open.spotify.com/track/5Odr16TvEN4my22K9nbH7l',
				'https://open.spotify.com/album/5bOlxyl4igOrp2DwVQxBco',
			].some(url => text.includes(url))) {
				claimAchievement('brainDiver');
			}

			if (props.renote && (props.renote.userId === $i.id) && text.length > 0) {
				claimAchievement('selfQuote');
			}

			const date = new Date();
			const h = date.getHours();
			const m = date.getMinutes();
			const s = date.getSeconds();
			if (h >= 0 && h <= 3) {
				claimAchievement('postedAtLateNight');
			}
			if (m === 0 && s === 0) {
				claimAchievement('postedAt0min0sec');
			}

			if (serverDraftId.value != null) {
				misskeyApi('notes/drafts/delete', { draftId: serverDraftId.value });
			}
		});
	}).catch(err => {
		posting.value = false;
		os.alert({
			type: 'error',
			text: err.message + '\n' + (err as any).id,
		});
	});
}

async function postAsScheduled() {
	if (props.mock) return;

	await saveServerDraft({
		isActuallyScheduled: true,
	});
}

function cancel() {
	emit('cancel');
}

function insertMention() {
	os.selectUser({ localOnly: localOnly.value, includeSelf: true }).then(user => {
		insertTextAtCursor(textareaEl.value, '@' + Misskey.acct.toString(user) + ' ');
	});
}

async function insertEmoji(ev: MouseEvent) {
	textAreaReadOnly.value = true;
	const target = ev.currentTarget ?? ev.target;
	if (target == null) return;

	// emojiPickerはダイアログが閉じずにtextareaとやりとりするので、
	// focustrapをかけているとinsertTextAtCursorが効かない
	// そのため、投稿フォームのテキストに直接注入する
	// See: https://github.com/misskey-dev/misskey/pull/14282
	//      https://github.com/misskey-dev/misskey/issues/14274

	let pos = textareaEl.value?.selectionStart ?? 0;
	let posEnd = textareaEl.value?.selectionEnd ?? text.value.length;
	emojiPicker.show(
		target as HTMLElement,
		emoji => {
			const textBefore = text.value.substring(0, pos);
			const textAfter = text.value.substring(posEnd);
			text.value = textBefore + emoji + textAfter;
			pos += emoji.length;
			posEnd += emoji.length;
		},
		() => {
			textAreaReadOnly.value = false;
			nextTick(() => focus());
		},
	);
}

async function insertMfmFunction(ev: MouseEvent) {
	if (textareaEl.value == null) return;
	mfmFunctionPicker(
		ev.currentTarget ?? ev.target,
		textareaEl.value,
		text,
	);
}

function showActions(ev: MouseEvent) {
	os.popupMenu(postFormActions.map(action => ({
		text: action.title,
		action: () => {
			action.handler({
				text: text.value,
				cw: cw.value,
			}, (key, value) => {
				if (typeof key !== 'string' || typeof value !== 'string') return;
				if (key === 'text') { text.value = value; }
				if (key === 'cw') { useCw.value = value !== null; cw.value = value; }
			});
		},
	})), ev.currentTarget ?? ev.target);
}

const postAccount = ref<Misskey.entities.UserDetailed | null>(null);

async function openAccountMenu(ev: MouseEvent) {
	if (props.mock) return;

	function showDraftsDialog(scheduled: boolean) {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkNoteDraftsDialog.vue')), {
			scheduled,
		}, {
			restore: async (draft: Misskey.entities.NoteDraft) => {
				text.value = draft.text ?? '';
				useCw.value = draft.cw != null;
				cw.value = draft.cw ?? null;
				visibility.value = draft.visibility;
				localOnly.value = draft.localOnly ?? false;
				files.value = draft.files ?? [];
				hashtags.value = draft.hashtag ?? '';
				if (draft.hashtag) withHashtags.value = true;
				if (draft.poll) {
					// 投票を一時的に空にしないと反映されないため
					poll.value = null;
					nextTick(() => {
						poll.value = {
							choices: draft.poll!.choices,
							multiple: draft.poll!.multiple,
							expiresAt: draft.poll!.expiresAt ? (new Date(draft.poll!.expiresAt)).getTime() : null,
							expiredAfter: null,
						};
					});
				}
				if (draft.visibleUserIds) {
					misskeyApi('users/show', { userIds: draft.visibleUserIds }).then(users => {
						users.forEach(u => pushVisibleUser(u));
					});
				}
				quoteId.value = draft.renoteId ?? null;
				renoteTargetNote.value = draft.renote;
				replyTargetNote.value = draft.reply;
				reactionAcceptance.value = draft.reactionAcceptance;
				scheduledAt.value = draft.scheduledAt ?? null;
				if (draft.channel) targetChannel.value = draft.channel as unknown as Misskey.entities.Channel;
				// やみノートモードの復元（muyami独自機能）
				isNoteInYamiMode.value = draft.isNoteInYamiMode ?? false;

				visibleUsers.value = [];
				draft.visibleUserIds?.forEach(uid => {
					if (!visibleUsers.value.some(u => u.id === uid)) {
						misskeyApi('users/show', { userId: uid }).then(user => {
							pushVisibleUser(user);
						});
					}
				});

				serverDraftId.value = draft.id;
			},
			cancel: () => {

			},
			closed: () => {
				dispose();
			},
		});
	}

	const items = await getAccountMenu({
		withExtraOperation: false,
		includeCurrentAccount: true,
		active: postAccount.value != null ? postAccount.value.id : $i.id,
		onChoose: (account) => {
			if (account.id === $i.id) {
				postAccount.value = null;
			} else {
				postAccount.value = account;
			}
		},
	});

	os.popupMenu([{
		type: 'button',
		text: i18n.ts._drafts.listDrafts,
		icon: 'ti ti-cloud-download',
		action: () => {
			showDraftsDialog(false);
		},
	}, {
		type: 'button',
		text: i18n.ts._drafts.listScheduledNotes,
		icon: 'ti ti-clock-down',
		action: () => {
			showDraftsDialog(true);
		},
	}, { type: 'divider' }, ...items], ev.currentTarget ?? ev.target);
}

function toggleScheduleNote() {
	if (scheduleNote.value) {
		scheduleNote.value = null;
	} else {
		scheduleNote.value = {
			scheduledAt: null,
			isValid: true,
		};
	}
}

// やみノートモードの切り替え関数
async function toggleYamiMode() {
	// canYamiNote権限がない場合は切り替え不可
	if (!$i.policies.canYamiNote) return;

	// 親がやみノートの場合は切り替え不可
	if (parentIsYamiNote.value) return;

	// 現在がやみノートでない状態から切り替える場合にダイアログを表示
	if (!isNoteInYamiMode.value) {
		const neverShowYamiModeInfo = miLocalStorage.getItem('neverShowYamiModeInfo');

		if (neverShowYamiModeInfo !== 'true') {
			const confirm = await os.actions({
				type: 'question',
				title: i18n.ts._yami.enableYamiNoteConfirm,
				text: i18n.ts._yami.enableYamiNoteConfirmWarn,
				actions: [
					{
						value: 'yes' as const,
						text: i18n.ts._yami.enableYamiNoteOk,
						primary: true,
					},
					{
						value: 'neverShow' as const,
						text: `${i18n.ts._yami.enableYamiNoteOk} (${i18n.ts.neverShow})`,
						danger: true,
					},
					{
						value: 'no' as const,
						text: i18n.ts.cancel,
					},
				],
			});

			if (confirm.canceled) return;
			if (confirm.result === 'no') return;

			if (confirm.result === 'neverShow') {
				miLocalStorage.setItem('neverShowYamiModeInfo', 'true');
			}
		}
	}

	isNoteInYamiMode.value = !isNoteInYamiMode.value;

	// 設定を記憶する場合のみ保存
	if (prefer.s.rememberNoteVisibility) {
		prefer.commit('isNoteInYamiMode', isNoteInYamiMode.value);
	}
}

function showPerUploadItemMenu(item: UploaderItem, ev: MouseEvent) {
	const menu = uploader.getMenu(item);
	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

function showPerUploadItemMenuViaContextmenu(item: UploaderItem, ev: MouseEvent) {
	const menu = uploader.getMenu(item);
	os.contextMenu(menu, ev);
}

async function schedule() {
	const { canceled, result } = await os.inputDatetime({
		title: i18n.ts.schedulePost,
	});
	if (canceled) return;
	if (result.getTime() <= Date.now()) return;

	scheduledAt.value = result.getTime();
}

function cancelSchedule() {
	scheduledAt.value = null;
}

function showTour() {
	if (textareaEl.value == null ||
		footerEl.value == null ||
		accountMenuEl.value == null ||
		visibilityButton.value == null ||
		otherSettingsButton.value == null ||
		submitButtonEl.value == null) {
		return;
	}

	startTour([{
		element: textareaEl.value,
		title: i18n.ts._postForm._howToUse.content_title,
		description: i18n.ts._postForm._howToUse.content_description,
	}, {
		element: footerEl.value,
		title: i18n.ts._postForm._howToUse.toolbar_title,
		description: i18n.ts._postForm._howToUse.toolbar_description,
	}, {
		element: accountMenuEl.value,
		title: i18n.ts._postForm._howToUse.account_title,
		description: i18n.ts._postForm._howToUse.account_description,
	}, {
		element: visibilityButton.value,
		title: i18n.ts._postForm._howToUse.visibility_title,
		description: i18n.ts._postForm._howToUse.visibility_description,
	}, {
		element: otherSettingsButton.value,
		title: i18n.ts._postForm._howToUse.menu_title,
		description: i18n.ts._postForm._howToUse.menu_description,
	}, {
		element: submitButtonEl.value,
		title: i18n.ts._postForm._howToUse.submit_title,
		description: i18n.ts._postForm._howToUse.submit_description,
	}]).then(() => {
		closeTip('postForm');
	});
}

onMounted(() => {
	if (props.autofocus) {
		focus();

		nextTick(() => {
			focus();
		});
	}

	// TODO: detach when unmount
	if (textareaEl.value) new Autocomplete(textareaEl.value, text);
	if (cwInputEl.value) new Autocomplete(cwInputEl.value, cw);
	if (hashtagsInputEl.value) new Autocomplete(hashtagsInputEl.value, hashtags);

	nextTick(() => {
		// 書きかけの投稿を復元
		if (!props.instant && !props.mention && !props.specified && !props.mock) {
			const draft = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}')[draftKey.value];
			if (draft) {
				text.value = draft.data.text;
				useCw.value = draft.data.useCw;
				cw.value = draft.data.cw;
				visibility.value = draft.data.visibility;
				localOnly.value = shouldLocalOnly.value
					? true
					: (draft.data.localOnly ?? false);
				files.value = (draft.data.files || []).filter(draftFile => draftFile);
				if (draft.data.poll) {
					poll.value = draft.data.poll;
				}
				if (draft.data.visibleUserIds) {
					misskeyApi('users/show', { userIds: draft.data.visibleUserIds }).then(users => {
						users.forEach(u => pushVisibleUser(u));
					});
				}
				quoteId.value = draft.data.quoteId;
				reactionAcceptance.value = draft.data.reactionAcceptance;
				scheduledAt.value = draft.data.scheduledAt ?? null;
				if (draft.data.scheduledNoteDelete) {
					scheduledNoteDelete.value = draft.data.scheduledNoteDelete;
				}
				// 通常フォームの場合のみドラフトから復元（固定フォームは上のwatchで処理済み）
				if (!props.fixed && !parentIsYamiNote.value) {
					isNoteInYamiMode.value = $i.policies.canYamiNote
						? (draft.data.isNoteInYamiMode ??
						  (prefer.s.rememberNoteVisibility ? prefer.s.isNoteInYamiMode : prefer.s.defaultIsNoteInYamiMode))
						: false;
				}
			}
		}

		// 削除して編集
		if (props.initialNote) {
			const init = props.initialNote;
			text.value = init.text ? init.text : '';
			useCw.value = init.cw != null;
			cw.value = init.cw ?? null;
			visibility.value = init.visibility;
			localOnly.value = shouldLocalOnly.value
				? true
				: (init.localOnly ?? false);
			files.value = init.files ?? [];
			if (init.poll) {
				poll.value = {
					choices: init.poll.choices.map(x => x.text),
					multiple: init.poll.multiple,
					expiresAt: init.poll.expiresAt ? (new Date(init.poll.expiresAt)).getTime() : null,
					expiredAfter: null,
				};
			}
			if (init.deleteAt) {
				scheduledNoteDelete.value = {
					deleteAt: init.deleteAt ? (new Date(init.deleteAt)).getTime() : null,
					deleteAfter: null,
					isValid: true,
				};
			}
			if (init.visibleUserIds) {
				misskeyApi('users/show', { userIds: init.visibleUserIds }).then(users => {
					users.forEach(u => pushVisibleUser(u));
				});
			}
			quoteId.value = init.renote ? init.renote.id : null;
			reactionAcceptance.value = init.reactionAcceptance;
			if (init.isSchedule) {
				scheduleNote.value = {
					scheduledAt: new Date(init.createdAt).getTime(),
					isValid: true,
				};
			}
			// 通常フォームの場合のみ元の投稿状態を継承（固定フォームは上のwatchで処理済み）
			if (!props.fixed && !parentIsYamiNote.value) {
				isNoteInYamiMode.value = init.isNoteInYamiMode ?? false;
			}
		}

		nextTick(() => watchForDraft());
	});
});

async function canClose() {
	if (!uploader.allItemsUploaded.value) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.ts._postForm.quitInspiteOfThereAreUnuploadedFilesConfirm,
			okText: i18n.ts.yes,
			cancelText: i18n.ts.no,
		});
		if (canceled) return false;
	}

	return true;
}

defineExpose({
	clear,
	abortUploader: () => uploader.abortAll(),
	canClose,
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	container-type: inline-size;

	&.modal {
		width: 100%;
		max-width: 520px;
		overflow-x: clip;
		overflow-y: auto;
	}
}

//#region header
.header {
	z-index: 1000;
	min-height: 50px;
	display: flex;
	flex-wrap: nowrap;
	gap: 4px;
}

.headerLeft {
	display: flex;
	flex: 1;
	flex-wrap: nowrap;
	align-items: center;
	gap: 6px;
	padding-left: 12px;
}

.cancel {
	padding: 8px;
}

.account {
}

.avatar {
	display: block;
	width: 28px;
	height: 28px;
	margin: auto;
	object-fit: cover;
}

.headerRight {
	display: flex;
	min-height: 48px;
	font-size: 0.9em;
	flex-wrap: nowrap;
	align-items: center;
	margin-left: auto;
	gap: 4px;
	overflow: clip;
	padding-left: 4px;
}

.submit {
	margin: 12px 12px 12px 6px;
	vertical-align: bottom;

	&:focus-visible {
		outline: none;

		> .submitInner {
			outline: 2px solid var(--MI_THEME-fgOnAccent);
			outline-offset: -4px;
		}
	}

	&:disabled {
		opacity: 0.7;
	}

	&.posting {
		cursor: wait;
	}

	&:not(:disabled):hover {
		> .submitInner {
			background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
		}
	}

	&:not(:disabled):active {
		> .submitInner {
			background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
		}
	}
}

.colorBar {
	position: absolute;
	top: 0px;
	left: 12px;
	width: 5px;
	height: 100% ;
	border-radius: 999px;
	pointer-events: none;
}

.submitInner {
	padding: 0 12px;
	line-height: 34px;
	font-weight: bold;
	border-radius: 6px;
	min-width: 90px;
	box-sizing: border-box;
	color: var(--MI_THEME-fgOnAccent);
	background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
}

.headerRightItem {
	margin: 0;
	padding: 8px;
	border-radius: 6px;

	&:hover {
		background: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
	}

	&:disabled {
		background: none;
	}

	&.danger {
		color: #ff2a2a;
	}

	&.warning {
		color: var(--MI_THEME-warn);
	}

	&.active {
		color: var(--MI_THEME-accent);
	}
}

.headerRightButtonText {
	padding-left: 6px;
}

.visibility {
	overflow: clip;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 210px;

	&:enabled {
		> .headerRightButtonText {
			opacity: 0.8;
		}
	}
}
//#endregion

.preview {
	padding: 16px 20px 0 20px;
	min-height: 75px;
	max-height: 150px;
	overflow: auto;
	background-size: auto auto;
}

html[data-color-scheme=dark] .preview {
	background-image: repeating-linear-gradient(135deg, transparent, transparent 5px, #0004 5px, #0004 10px);
}

html[data-color-scheme=light] .preview {
	background-image: repeating-linear-gradient(135deg, transparent, transparent 5px, #00000005 5px, #00000005 10px);
}

.targetNote {
	padding: 0 20px 16px 20px;
}

.withQuote {
	margin: 0 0 8px 0;
	color: var(--MI_THEME-accent);
}

.toSpecified {
	padding: 6px 24px;
	margin-bottom: 8px;
	overflow: auto;
	white-space: nowrap;
}

.visibleUsers {
	display: inline;
	top: -1px;
	font-size: 14px;
}

.visibleUser {
	margin-right: 14px;
	padding: 8px 0 8px 8px;
	border-radius: 8px;
	background: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1));
}

.hasNotSpecifiedMentions {
	margin: 0 20px 16px 20px;
}

.scheduledAt {
	margin: 0 20px 16px 20px;
}

.showHowToUse {
	margin: 0 20px 16px 20px;
}

.cw,
.hashtags,
.text {
	display: block;
	box-sizing: border-box;
	padding: 0 24px;
	margin: 0;
	width: 100%;
	font-size: 110%;
	border: none;
	border-radius: 0;
	background: transparent;
	color: var(--MI_THEME-fg);
	font-family: inherit;

	&:focus {
		outline: none;
	}

	&:disabled {
		opacity: 0.5;
	}
}

.cwOuter {
	width: 100%;
	position: relative;
}

.cw {
	z-index: 1;
	padding-bottom: 8px;
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.cwTextCount {
	position: absolute;
	top: 0;
	right: 2px;
	padding: 2px 6px;
	font-size: .9em;
	color: var(--MI_THEME-warn);
	border-radius: 6px;
	max-width: 100%;
	min-width: 1.6em;
	text-align: center;

	&.cwTextOver {
		color: #ff2a2a;
	}
}

.hashtags {
	z-index: 1;
	padding-top: 8px;
	padding-bottom: 8px;
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.textOuter {
	width: 100%;
	position: relative;

	&.withCw {
		padding-top: 8px;
	}
}

.text {
	max-width: 100%;
	min-width: 100%;
	width: 100%;
	min-height: 90px;
	height: 100%;
}

.textCount {
	position: absolute;
	top: 0;
	right: 2px;
	padding: 4px 6px;
	font-size: .9em;
	color: var(--MI_THEME-warn);
	border-radius: 6px;
	min-width: 1.6em;
	text-align: center;

	&.textOver {
		color: #ff2a2a;
	}
}

.footer {
	display: flex;
	padding: 0 16px 16px 16px;
	font-size: 1em;
}

.footerLeft {
	flex: 1;
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
	grid-auto-rows: 40px;
}

.footerRight {
	flex: 0;
	margin-left: auto;
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
	grid-auto-rows: 40px;
	direction: rtl;
}

.footerButton {
	display: inline-block;
	padding: 0;
	margin: 0;
	font-size: 1em;
	width: auto;
	height: 100%;
	border-radius: 6px;

	&:hover {
		background: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
	}

	&.footerButtonActive {
		color: var(--MI_THEME-accent);
	}
}

.previewButtonActive {
	color: var(--MI_THEME-accent);
}

@container (max-width: 500px) {
	.headerRight {
		font-size: .9em;
	}

	.headerRightButtonText {
		display: none;
	}

	.visibility {
		overflow: initial;
	}

	.submit {
		margin: 8px 8px 8px 4px;
	}

	.toSpecified {
		padding: 6px 16px;
	}

	.preview {
		padding: 16px 14px 0 14px;
	}
	.cw,
	.hashtags,
	.text {
		padding: 0 16px;
	}

	.text {
		min-height: 80px;
	}

	.footer {
		padding: 0 8px 8px 8px;
	}
}

@container (max-width: 350px) {
	.footer {
		font-size: 0.9em;
	}

	.footerLeft {
		grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
	}

	.footerRight {
		grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
	}

	.headerRight {
		gap: 0;
	}

}
</style>
