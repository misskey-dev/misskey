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
			<button v-click-anime v-tooltip="i18n.ts.switchAccount" :class="$style.account" class="_button" @click="openAccountMenu">
				<MkAvatar :user="postAccount ?? $i" :class="$style.avatar"/>
			</button>
		</div>
		<div :class="$style.headerRight">
			<template v-if="!(channel != null && fixed)">
				<button v-if="channel == null" ref="visibilityButton" v-click-anime v-tooltip="i18n.ts.visibility" :class="['_button', $style.headerRightItem, $style.visibility]" @click="setVisibility">
					<span v-if="visibility === 'public'"><i class="ti ti-world"></i></span>
					<span v-if="visibility === 'home'"><i class="ti ti-home"></i></span>
					<span v-if="visibility === 'followers'"><i class="ti ti-lock"></i></span>
					<span v-if="visibility === 'specified'"><i class="ti ti-mail"></i></span>
					<span :class="$style.headerRightButtonText">{{ i18n.ts._visibility[visibility] }}</span>
				</button>
				<button v-else class="_button" :class="[$style.headerRightItem, $style.visibility]" disabled>
					<span><i class="ti ti-device-tv"></i></span>
					<span :class="$style.headerRightButtonText">{{ channel.name }}</span>
				</button>
			</template>
			<button v-click-anime v-tooltip="i18n.ts._visibility.disableFederation" class="_button" :class="[$style.headerRightItem, { [$style.danger]: localOnly }]" :disabled="channel != null || visibility === 'specified'" @click="toggleLocalOnly">
				<span v-if="!localOnly"><i class="ti ti-rocket"></i></span>
				<span v-else><i class="ti ti-rocket-off"></i></span>
			</button>
			<button v-click-anime v-tooltip="i18n.ts.reactionAcceptance" class="_button" :class="[$style.headerRightItem, { [$style.danger]: reactionAcceptance === 'likeOnly' }]" @click="toggleReactionAcceptance">
				<span v-if="reactionAcceptance === 'likeOnly'"><i class="ti ti-heart"></i></span>
				<span v-else-if="reactionAcceptance === 'likeOnlyForRemote'"><i class="ti ti-heart-plus"></i></span>
				<span v-else><i class="ti ti-icons"></i></span>
			</button>
			<button v-if="!props.instant" v-click-anime v-tooltip="i18n.ts.drafts" class="_button" :class="$style.headerRightItem" @click="openDrafts">
				<i class="ti ti-pencil"></i>
			</button>
			<button v-click-anime class="_button" :class="$style.submit" :disabled="!canPost" data-cy-open-post-form-submit @click="post">
				<div :class="$style.submitInner">
					<template v-if="posted"></template>
					<template v-else-if="posting"><MkEllipsis/></template>
					<template v-else>
						<span :class="$style.submitButtonText">
							{{ submitText }}
						</span>
					</template>
					<span>
						<i :class="posted ? 'ti ti-check' : reply ? 'ti ti-arrow-back-up' : renote ? 'ti ti-quote' : 'ti ti-send'"></i>
					</span>
				</div>
			</button>
		</div>
	</header>
	<MkNoteSimple v-if="reply" :class="$style.targetNote" :note="reply"/>
	<MkNoteSimple v-if="renote" :class="$style.targetNote" :note="renote"/>
	<div v-if="quoteId" :class="$style.withQuote"><i class="ti ti-quote"></i> {{ i18n.ts.quoteAttached }}<button @click="quoteId = null"><i class="ti ti-x"></i></button></div>
	<div v-if="visibility === 'specified'" :class="$style.toSpecified">
		<span style="margin-right: 8px;">{{ i18n.ts.recipient }}</span>
		<div :class="$style.visibleUsers">
			<span v-for="u in visibleUsers" :key="u.id" :class="$style.visibleUser">
				<MkAcct :user="u"/>
				<button class="_button" style="padding: 4px 8px;" @click="removeVisibleUser(u)"><i class="ti ti-x"></i></button>
			</span>
			<button class="_buttonPrimary" style="padding: 4px; border-radius: 8px;" @click="addVisibleUser"><i class="ti ti-plus ti-fw"></i></button>
		</div>
	</div>
	<MkInfo v-if="hasNotSpecifiedMentions" warn :class="$style.hasNotSpecifiedMentions">{{ i18n.ts.notSpecifiedMentionWarning }} - <button class="_textButton" @click="addMissingMention()">{{ i18n.ts.add }}</button></MkInfo>
	<input v-show="useCw" ref="cwInputEl" v-model="cw" class="mk-input-text" :class="$style.cw" :placeholder="i18n.ts.annotation" @keydown="onKeydown">
	<div :class="[$style.textOuter, { [$style.withCw]: useCw }]">
		<div v-if="channel" :class="$style.colorBar" :style="{ background: channel.color }"></div>
		<textarea ref="textareaEl" v-model="text" :class="[$style.text]" :disabled="posting || posted" :readonly="textAreaReadOnly" :placeholder="placeholder" data-cy-post-form-text @keydown="onKeydown" @paste="onPaste" @compositionupdate="onCompositionUpdate" @compositionend="onCompositionEnd"/>
		<div v-if="maxTextLength - textLength < 100" :class="['_acrylic', $style.textCount, { [$style.textOver]: textLength > maxTextLength }]">{{ maxTextLength - textLength }}</div>
	</div>
	<input v-show="withHashtags" ref="hashtagsInputEl" v-model="hashtags" class="mk-input-text" :class="$style.hashtags" :placeholder="i18n.ts.hashtags" list="hashtags">
	<MkInfo v-if="files.length > 0" warn :class="$style.guidelineInfo" :rounded="false"><Mfm :text="i18n.tsx._postForm.guidelineInfo({ tosUrl: instance.tosUrl, nsfwGuideUrl })"/></MkInfo>
	<XPostFormAttaches v-model="files" @detach="detachFile" @changeSensitive="updateFileSensitive" @changeName="updateFileName" @replaceFile="replaceFile"/>
	<MkPollEditor v-if="poll" v-model="poll" @destroyed="poll = null"/>
	<MkNotePreview v-if="showPreview" :class="$style.preview" :text="text" :files="files" :poll="poll ?? undefined" :useCw="useCw" :cw="cw" :user="postAccount ?? $i"/>
	<div v-if="showingOptions" style="padding: 8px 16px;">
	</div>
	<footer :class="$style.footer">
		<div :class="$style.footerLeft">
			<button v-tooltip="i18n.ts.attachFile" class="_button" :class="$style.footerButton" @click="chooseFileFrom"><i class="ti ti-photo-plus"></i></button>
			<button v-tooltip="i18n.ts.poll" class="_button" :class="[$style.footerButton, { [$style.footerButtonActive]: poll }]" @click="togglePoll"><i class="ti ti-chart-arrows"></i></button>
			<button v-tooltip="i18n.ts.useCw" class="_button" :class="[$style.footerButton, { [$style.footerButtonActive]: useCw }]" @click="useCw = !useCw"><i class="ti ti-eye-off"></i></button>
			<button v-tooltip="i18n.ts.mention" class="_button" :class="$style.footerButton" @click="insertMention"><i class="ti ti-at"></i></button>
			<button v-tooltip="i18n.ts.hashtags" class="_button" :class="[$style.footerButton, { [$style.footerButtonActive]: withHashtags }]" @click="withHashtags = !withHashtags"><i class="ti ti-hash"></i></button>
			<button v-if="postFormActions.length > 0" v-tooltip="i18n.ts.plugins" class="_button" :class="$style.footerButton" @click="showActions"><i class="ti ti-plug"></i></button>
			<button v-tooltip="i18n.ts.emoji" :class="['_button', $style.footerButton]" @click="insertEmoji"><i class="ti ti-mood-happy"></i></button>
			<button v-if="showAddMfmFunction" v-tooltip="i18n.ts.addMfmFunction" :class="['_button', $style.footerButton]" @click="insertMfmFunction"><i class="ti ti-palette"></i></button>
		</div>
		<div :class="$style.footerRight">
			<button v-tooltip="i18n.ts.previewNoteText" class="_button" :class="[$style.footerButton, { [$style.previewButtonActive]: showPreview }]" @click="showPreview = !showPreview"><i class="ti ti-eye"></i></button>
			<!--<button v-tooltip="i18n.ts.more" class="_button" :class="$style.footerButton" @click="showingOptions = !showingOptions"><i class="ti ti-dots"></i></button>-->
		</div>
	</footer>
	<datalist id="hashtags">
		<option v-for="hashtag in recentHashtags" :key="hashtag" :value="hashtag"/>
	</datalist>
</div>
</template>

<script lang="ts" setup>
import { inject, watch, nextTick, onMounted, onUnmounted, defineAsyncComponent, provide, shallowRef, ref, computed } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import insertTextAtCursor from 'insert-text-at-cursor';
import { toASCII } from 'punycode.js';
import type { NoteDraftItem } from '@/types/note-draft-item.js';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkNotePreview from '@/components/MkNotePreview.vue';
import XPostFormAttaches from '@/components/MkPostFormAttaches.vue';
import MkPollEditor, { type PollEditorModelValue } from '@/components/MkPollEditor.vue';
import MkDraftsDialog from '@/components/MkDraftsDialog.vue';
import { host, url } from '@/config.js';
import { erase, unique } from '@/scripts/array.js';
import { extractMentions } from '@/scripts/extract-mentions.js';
import { formatTimeString } from '@/scripts/format-time-string.js';
import { Autocomplete } from '@/scripts/autocomplete.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { selectFiles } from '@/scripts/select-file.js';
import { defaultStore, notePostInterruptors, postFormActions } from '@/store.js';
import MkInfo from '@/components/MkInfo.vue';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { signinRequired, notesCount, incNotesCount, getAccounts, openAccountMenu as openAccountMenu_ } from '@/account.js';
import { uploadFile } from '@/scripts/upload.js';
import { deepClone } from '@/scripts/clone.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { miLocalStorage } from '@/local-storage.js';
import { claimAchievement } from '@/scripts/achievements.js';
import { emojiPicker } from '@/scripts/emoji-picker.js';
import { mfmFunctionPicker } from '@/scripts/mfm-function-picker.js';

const $i = signinRequired();

const modal = inject('modal');

const props = withDefaults(defineProps<{
	reply?: Misskey.entities.Note;
	renote?: Misskey.entities.Note;
	channel?: Misskey.entities.Channel; // TODO
	mention?: Misskey.entities.User;
	specified?: Misskey.entities.UserDetailed;
	initialText?: string;
	initialCw?: string;
	initialVisibility?: (typeof Misskey.noteVisibilities)[number];
	initialFiles?: Misskey.entities.DriveFile[];
	initialLocalOnly?: boolean;
	initialVisibleUsers?: Misskey.entities.UserDetailed[];
	initialNote?: Misskey.entities.Note;
	instant?: boolean;
	fixed?: boolean;
	autofocus?: boolean;
	freezeAfterPosted?: boolean;
	mock?: boolean;
}>(), {
	initialVisibleUsers: () => [],
	autofocus: true,
	mock: false,
	initialLocalOnly: undefined,
});

provide('mock', props.mock);

const emit = defineEmits<{
	(ev: 'posting'): void;
	(ev: 'posted'): void;
	(ev: 'postError'): void;
	(ev: 'cancel'): void;
	(ev: 'esc'): void;

	// Mock用
	(ev: 'fileChangeSensitive', fileId: string, to: boolean): void;
}>();

const textareaEl = shallowRef<HTMLTextAreaElement | null>(null);
const cwInputEl = shallowRef<HTMLInputElement | null>(null);
const hashtagsInputEl = shallowRef<HTMLInputElement | null>(null);
const visibilityButton = shallowRef<HTMLElement>();

const posting = ref(false);
const posted = ref(false);
const draftId = ref<string>(Date.now().toString());
const reply = ref(props.reply ?? null);
const renote = ref(props.renote ?? null);
const channel = ref(props.channel ?? null);
const text = ref(props.initialText ?? '');
const files = ref(props.initialFiles ?? []);
const poll = ref<PollEditorModelValue | null>(null);
const useCw = ref<boolean>(!!props.initialCw);
const showPreview = ref(defaultStore.state.showPreview);
watch(showPreview, () => defaultStore.set('showPreview', showPreview.value));
const showAddMfmFunction = ref(defaultStore.state.enableQuickAddMfmFunction);
watch(showAddMfmFunction, () => defaultStore.set('enableQuickAddMfmFunction', showAddMfmFunction.value));
const cw = ref<string | null>(props.initialCw ?? null);
const localOnly = ref(props.initialLocalOnly ?? (defaultStore.state.rememberNoteVisibility ? defaultStore.state.localOnly : defaultStore.state.defaultNoteLocalOnly));
const visibility = ref(props.initialVisibility ?? (defaultStore.state.rememberNoteVisibility ? defaultStore.state.visibility : defaultStore.state.defaultNoteVisibility));
const visibleUsers = ref<Misskey.entities.UserDetailed[]>([]);
if (props.initialVisibleUsers) {
	props.initialVisibleUsers.forEach(u => pushVisibleUser(u));
}
const reactionAcceptance = ref(defaultStore.state.reactionAcceptance);
const autocompleteTextareaInput = ref<Autocomplete | null>(null);
const autocompleteCwInput = ref<Autocomplete | null>(null);
const autocompleteHashtagsInput = ref<Autocomplete | null>(null);
const draghover = ref(false);
const quoteId = ref<string | null>(null);
const hasNotSpecifiedMentions = ref(false);
const recentHashtags = ref(JSON.parse(miLocalStorage.getItem('hashtags') ?? '[]'));
const imeText = ref('');
const showingOptions = ref(false);
const textAreaReadOnly = ref(false);

const nsfwGuideUrl = 'https://go.misskey.io/media-guideline';

const draftKey = computed((): string => {
	let key = channel.value ? `channel:${channel.value.id}` : '';

	if (renote.value) {
		key += `renote:${renote.value.id}`;
	} else if (reply.value) {
		key += `reply:${reply.value.id}`;
	} else {
		key += `note:${draftId.value}`;
	}

	return key;
});

const placeholder = computed((): string => {
	if (renote.value) {
		return i18n.ts._postForm.quotePlaceholder;
	} else if (reply.value) {
		return i18n.ts._postForm.replyPlaceholder;
	} else if (channel.value) {
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
	return renote.value
		? i18n.ts.quote
		: reply.value
			? i18n.ts.reply
			: i18n.ts.note;
});

const textLength = computed((): number => {
	return (text.value + imeText.value).trim().length;
});

const maxTextLength = computed((): number => {
	return instance ? instance.maxNoteTextLength : 1000;
});

const canPost = computed((): boolean => {
	return !props.mock && !posting.value && !posted.value &&
		(
			1 <= textLength.value ||
			1 <= files.value.length ||
			poll.value != null ||
			renote.value != null ||
			(reply.value != null && quoteId.value != null)
		) &&
		(textLength.value <= maxTextLength.value) &&
		(!poll.value || poll.value.choices.length >= 2);
});

const withHashtags = computed(defaultStore.makeGetterSetter('postFormWithHashtags'));
const hashtags = computed(defaultStore.makeGetterSetter('postFormHashtags'));

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

if (props.mention) {
	text.value = props.mention.host ? `@${props.mention.username}@${toASCII(props.mention.host)}` : `@${props.mention.username}`;
	text.value += ' ';
}

if (reply.value && (reply.value.user.username !== $i.username || (reply.value.user.host != null && reply.value.user.host !== host))) {
	text.value = `@${reply.value.user.username}${reply.value.user.host != null ? '@' + toASCII(reply.value.user.host) : ''} `;
}

if (reply.value && reply.value.text != null) {
	const ast = mfm.parse(reply.value.text);
	const otherHost = reply.value.user.host;

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

if (channel.value) {
	visibility.value = 'public';
	localOnly.value = true; // TODO: チャンネルが連合するようになった折には消す
}

// 公開以外へのリプライ時は元の公開範囲を引き継ぐ
if (reply.value && ['home', 'followers', 'specified'].includes(reply.value.visibility)) {
	if (reply.value.visibility === 'home' && visibility.value === 'followers') {
		visibility.value = 'followers';
	} else if (['home', 'followers'].includes(reply.value.visibility) && visibility.value === 'specified') {
		visibility.value = 'specified';
	} else {
		visibility.value = reply.value.visibility;
	}

	if (visibility.value === 'specified') {
		if (reply.value.visibleUserIds) {
			misskeyApi('users/show', {
				userIds: reply.value.visibleUserIds.filter(uid => uid !== $i.id && uid !== reply.value?.userId),
			}).then(users => {
				users.forEach(u => pushVisibleUser(u));
			});
		}

		if (reply.value.userId !== $i.id) {
			misskeyApi('users/show', { userId: reply.value.userId }).then(user => {
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
if (defaultStore.state.keepCw && reply.value?.cw) {
	useCw.value = true;
	cw.value = reply.value.cw;
}

function watchForDraft() {
	watch(text, () => saveDraft());
	watch(useCw, () => saveDraft());
	watch(cw, () => saveDraft());
	watch(poll, () => saveDraft());
	watch(files, () => saveDraft(), { deep: true });
	watch(visibility, () => saveDraft());
	watch(localOnly, () => saveDraft());
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

function addTag(tag: string) {
	insertTextAtCursor(textareaEl.value, ` #${tag} `);
}

function focus() {
	if (textareaEl.value) {
		textareaEl.value.focus();
		textareaEl.value.setSelectionRange(textareaEl.value.value.length, textareaEl.value.value.length);
	}
}

function chooseFileFrom(ev) {
	if (props.mock) return;

	selectFiles(ev.currentTarget ?? ev.target, i18n.ts.attachFile).then(files_ => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		for (const file of files_.filter(f => f?.id)) {
			files.value.push(file);
		}
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

function replaceFile(file: Misskey.entities.DriveFile, newFile: Misskey.entities.DriveFile): void {
	files.value[files.value.findIndex(x => x.id === file.id)] = newFile;
}

function upload(file: File, name?: string): void {
	if (props.mock) return;

	uploadFile(file, defaultStore.state.uploadFolder, name).then(res => {
		if (res.id) files.value.push(res);
	});
}

function setVisibility() {
	if (channel.value) {
		visibility.value = 'public';
		localOnly.value = true; // TODO: チャンネルが連合するようになった折には消す
		return;
	}

	os.popup(defineAsyncComponent(() => import('@/components/MkVisibilityPicker.vue')), {
		currentVisibility: visibility.value,
		isSilenced: $i.isSilenced,
		localOnly: localOnly.value,
		src: visibilityButton.value,
		...(reply.value ? { isReplyVisibilitySpecified: reply.value.visibility === 'specified' } : {}),
	}, {
		changeVisibility: v => {
			visibility.value = v;
			if (defaultStore.state.rememberNoteVisibility) {
				defaultStore.set('visibility', visibility.value);
			}
		},
	}, 'closed');
}

async function toggleLocalOnly() {
	if (channel.value) {
		visibility.value = 'public';
		localOnly.value = true; // TODO: チャンネルが連合するようになった折には消す
		return;
	}

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
	if (defaultStore.state.rememberNoteVisibility) {
		defaultStore.set('localOnly', localOnly.value);
	}
}

async function toggleReactionAcceptance() {
	const select = await os.select({
		title: i18n.ts.reactionAcceptance,
		items: [
			{ value: null, text: i18n.ts.all },
			{ value: 'likeOnlyForRemote' as const, text: i18n.ts.likeOnlyForRemote },
			{ value: 'nonSensitiveOnly' as const, text: i18n.ts.nonSensitiveOnly },
			{ value: 'nonSensitiveOnlyForLocalLikeOnlyForRemote' as const, text: i18n.ts.nonSensitiveOnlyForLocalLikeOnlyForRemote },
			{ value: 'likeOnly' as const, text: i18n.ts.likeOnly },
		],
		default: reactionAcceptance.value,
	});
	if (select.canceled) return;
	reactionAcceptance.value = select.result;
}

function pushVisibleUser(user: Misskey.entities.UserDetailed) {
	if (!visibleUsers.value.some(u => u.username === user.username && u.host === user.host)) {
		visibleUsers.value.push(user);
	}
}

function addVisibleUser() {
	os.selectUser().then(user => {
		pushVisibleUser(user);

		if (!text.value.toLowerCase().includes(`@${user.username.toLowerCase()}`)) {
			text.value = `@${Misskey.acct.toString(user)} ${text.value}`;
		}
	});
}

function removeVisibleUser(user) {
	visibleUsers.value = erase(user, visibleUsers.value);
}

function clear() {
	text.value = '';
	files.value = [];
	poll.value = null;
	quoteId.value = null;
}

function onKeydown(ev: KeyboardEvent) {
	if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey) && canPost.value) post();
	if (ev.key === 'Escape') emit('esc');
}

function onCompositionUpdate(ev: CompositionEvent) {
	imeText.value = ev.data;
}

function onCompositionEnd(ev: CompositionEvent) {
	imeText.value = '';
}

async function onPaste(ev: ClipboardEvent) {
	if (props.mock) return;
	if (!ev.clipboardData) return;

	for (const { item, i } of Array.from(ev.clipboardData.items, (data, x) => ({ item: data, i: x }))) {
		if (item.kind === 'file') {
			const file = item.getAsFile();
			if (!file) continue;
			const lio = file.name.lastIndexOf('.');
			const ext = lio >= 0 ? file.name.slice(lio) : '';
			const formatted = `${formatTimeString(new Date(file.lastModified), defaultStore.state.pastedFileName).replace(/{{number}}/g, `${i + 1}`)}${ext}`;
			upload(file, formatted);
		}
	}

	const paste = ev.clipboardData.getData('text');

	if (!renote.value && !quoteId.value && paste.startsWith(url + '/notes/')) {
		ev.preventDefault();

		os.confirm({
			type: 'info',
			text: i18n.ts.quoteQuestion,
		}).then(({ canceled }) => {
			if (canceled) {
				insertTextAtCursor(textareaEl.value, paste);
				return;
			}

			quoteId.value = RegExp(/^\/notes\/(.+?)\/?$/).exec(paste.substring(url.length))?.[1] ?? null;
		});
	}
}

function onDragover(ev) {
	if (!ev.dataTransfer.items[0]) return;
	const isFile = ev.dataTransfer.items[0].kind === 'file';
	const isDriveFile = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FILE_;
	if (isFile || isDriveFile) {
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
		for (const x of Array.from(ev.dataTransfer.files)) upload(x);
		return;
	}

	//#region ドライブのファイル
	const driveFile = ev.dataTransfer?.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== '') {
		const file = JSON.parse(driveFile);
		if (file?.id) files.value.push(file);
		ev.preventDefault();
	}
	//#endregion
}

function saveDraft() {
	if (props.instant || props.mock) return;

	const draftData = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as Record<string, NoteDraftItem>;

	draftData[draftKey.value] = {
		updatedAt: new Date().toISOString(),
		channel: channel.value ? {
			id: channel.value.id,
			name: channel.value.name,
		} : undefined,
		renote: renote.value ? {
			id: renote.value.id,
			text: (renote.value.cw ?? renote.value.text)?.substring(0, 100),
			user: {
				id: renote.value.userId,
				username: renote.value.user.username,
				host: renote.value.user.host,
			},
		} : undefined,
		reply: reply.value ? {
			id: reply.value.id,
			text: (reply.value.cw ?? reply.value.text)?.substring(0, 100),
			user: {
				id: reply.value.userId,
				username: reply.value.user.username,
				host: reply.value.user.host,
			},
		} : undefined,
		data: {
			text: text.value,
			useCw: useCw.value,
			cw: cw.value,
			visibility: visibility.value,
			localOnly: localOnly.value,
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			files: files.value.filter(f => f?.id && f.type && f.name),
			poll: poll.value,
			visibleUserIds: visibility.value === 'specified' ? visibleUsers.value.map(x => x.id) : undefined,
		},
	};

	miLocalStorage.setItem('drafts', JSON.stringify(draftData));
}

function deleteDraft() {
	const draftData = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as Record<string, NoteDraftItem>;

	delete draftData[draftKey.value];

	draftId.value = Date.now().toString();

	miLocalStorage.setItem('drafts', JSON.stringify(draftData));
}

async function openDrafts() {
	const { canceled, selected } = await new Promise<{canceled: boolean, selected: string | undefined}>(resolve => {
		os.popup(MkDraftsDialog, {}, {
			done: result => {
				resolve(typeof result.selected === 'string' ? result : { canceled: true, selected: undefined });
			},
		}, 'closed');
	});

	if (canceled) return;

	if (selected) {
		const channelId = selected.startsWith('channel:') ? selected.match(/channel:(.+?)(renote|reply|note):/)?.[1] : undefined;
		const renoteId = selected.includes('renote:') ? selected.match(/renote:(.+)/)?.[1] : undefined;
		const replyId = selected.includes('reply:') ? selected.match(/reply:(.+)/)?.[1] : undefined;

		channel.value = channelId ? await misskeyApi('channels/show', { channelId }) : null;
		renote.value = renoteId ? await misskeyApi('notes/show', { noteId: renoteId }) : null;
		reply.value = replyId ? await misskeyApi('notes/show', { noteId: replyId }) : null;

		if (!renote.value && !reply.value) {
			draftId.value = selected.match(/note:(.+)/)?.[1] ?? Date.now().toString();
		} else {
			draftId.value = Date.now().toString();
		}

		loadDraft(true);
	}
}

function loadDraft(exactMatch = false) {
	const drafts = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as Record<string, NoteDraftItem>;
	const scope = exactMatch ? draftKey.value : draftKey.value.replace(`note:${draftId.value}`, 'note:');
	const draft = Object.entries(drafts).filter(([k]) => k.startsWith(scope))
		.map(r => ({ key: r[0], value: { ...r[1], updatedAt: new Date(r[1].updatedAt).getTime() } }))
		.sort((a, b) => b.value.updatedAt - a.value.updatedAt).at(0);

	if (draft) {
		if (scope !== draft.key) {
			draftId.value = draft.key.replace(scope, '');
		}

		text.value = draft.value.data.text;
		useCw.value = draft.value.data.useCw;
		cw.value = draft.value.data.cw;
		visibility.value = draft.value.data.visibility;
		localOnly.value = draft.value.data.localOnly;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		files.value = draft.value.data.files?.filter(f => f?.id && f.type && f.name) || [];
		if (draft.value.data.poll) {
			poll.value = draft.value.data.poll;
		}
		if (draft.value.data.visibleUserIds) {
			misskeyApi('users/show', { userIds: draft.value.data.visibleUserIds }).then(users => {
				users.forEach(u => pushVisibleUser(u));
			});
		}
	}
}

async function post(ev?: MouseEvent) {
	if (useCw.value && (cw.value == null || cw.value.trim() === '')) {
		os.alert({
			type: 'error',
			text: i18n.ts.cwNotationRequired,
		});
		return;
	}

	if (ev) {
		const el = (ev.currentTarget ?? ev.target) as HTMLElement | null;

		if (el) {
			const rect = el.getBoundingClientRect();
			const x = rect.left + (el.offsetWidth / 2);
			const y = rect.top + (el.offsetHeight / 2);
			os.popup(MkRippleEffect, { x, y }, {}, 'end');
		}
	}

	if (props.mock) return;

	const annoying =
		text.value.includes('$[x2') ||
		text.value.includes('$[x3') ||
		text.value.includes('$[x4') ||
		text.value.includes('$[scale') ||
		text.value.includes('$[position');

	if (annoying && visibility.value === 'public') {
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

	let postData = {
		text: text.value === '' ? null : text.value,
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		fileIds: files.value.length > 0 ? files.value.filter(f => f?.id).map(f => f.id) : undefined,
		replyId: reply.value ? reply.value.id : undefined,
		renoteId: renote.value ? renote.value.id : quoteId.value ? quoteId.value : undefined,
		channelId: channel.value ? channel.value.id : undefined,
		poll: poll.value,
		cw: useCw.value ? cw.value ?? '' : null,
		localOnly: localOnly.value,
		visibility: visibility.value,
		visibleUserIds: visibility.value === 'specified' ? visibleUsers.value.map(u => u.id) : undefined,
		reactionAcceptance: reactionAcceptance.value,
		noCreatedNote: true,
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
	if (notePostInterruptors.length > 0) {
		for (const interruptor of notePostInterruptors) {
			try {
				postData = await interruptor.handler(deepClone(postData)) as typeof postData;
			} catch (err) {
				console.error(err);
			}
		}
	}

	let token: string | undefined = undefined;

	if (postAccount.value) {
		const storedAccounts = await getAccounts();
		token = storedAccounts.find(x => x.id === postAccount.value?.id)?.token;
	}

	posting.value = true;
	misskeyApi('notes/create', postData, token).then(() => {
		if (props.freezeAfterPosted) {
			posted.value = true;
		} else {
			clear();
		}
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

			if (renote.value && (renote.value.userId === $i.id) && text.length > 0) {
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
		});
	}).catch(err => {
		posting.value = false;
		os.alert({
			type: 'error',
			text: err.message + '\n' + (err as any).id,
		});
		emit('postError');
	});
	emit('posting');
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
	os.openEmojiPicker(
		(ev.currentTarget ?? ev.target) as HTMLElement,
		{ asReactionPicker: false },
		textareaEl.value,
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
			}, (key, value: any) => {
				if (typeof key !== 'string') return;
				if (key === 'text') { text.value = value; }
				if (key === 'cw') { useCw.value = value !== null; cw.value = value; }
			});
		},
	})), ev.currentTarget ?? ev.target);
}

const postAccount = ref<Misskey.entities.UserDetailed | null>(null);

function openAccountMenu(ev: MouseEvent) {
	if (props.mock) return;

	openAccountMenu_({
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
	}, ev);
}

onMounted(() => {
	if (props.autofocus) {
		focus();

		nextTick(() => {
			focus();
		});
	}

	autocompleteTextareaInput.value = new Autocomplete(textareaEl.value, text);
	autocompleteCwInput.value = new Autocomplete(cwInputEl.value, cw);
	autocompleteHashtagsInput.value = new Autocomplete(hashtagsInputEl.value, hashtags);

	nextTick(() => {
		// 書きかけの投稿を復元
		if (!props.instant && !props.mention && !props.specified && !props.mock && defaultStore.state.autoloadDrafts) {
			loadDraft();
		}

		// 削除して編集
		if (props.initialNote) {
			const init = props.initialNote;
			text.value = init.text ? init.text : '';
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			files.value = init.files?.filter(f => f?.id && f.type && f.name) ?? [];
			cw.value = init.cw ?? null;
			useCw.value = init.cw != null;
			if (init.poll) {
				poll.value = {
					choices: init.poll.choices.map(x => x.text),
					multiple: init.poll.multiple,
					expiresAt: init.poll.expiresAt ? (new Date(init.poll.expiresAt)).getTime() : null,
					expiredAfter: null,
				};
			}
			visibility.value = init.visibility;
			localOnly.value = init.localOnly ?? false;
			quoteId.value = init.renote ? init.renote.id : null;
		}

		nextTick(() => watchForDraft());
	});
});

onUnmounted(() => {
	autocompleteTextareaInput.value?.detach();
	autocompleteTextareaInput.value = null;
	autocompleteCwInput.value?.detach();
	autocompleteCwInput.value = null;
	autocompleteHashtagsInput.value?.detach();
	autocompleteHashtagsInput.value = null;
});

defineExpose({
	clear,
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	container-type: inline-size;

	&.modal {
		width: 100%;
		max-width: 520px;
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
	flex: 0 1 100px;
}

.cancel {
	padding: 0;
	font-size: 1em;
	height: 100%;
	flex: 0 1 50px;
}

.account {
	height: 100%;
	display: inline-flex;
	vertical-align: bottom;
	flex: 0 1 50px;
}

.avatar {
	width: 28px;
	height: 28px;
	margin: auto;
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

	&:disabled {
		opacity: 0.7;
	}

	&.posting {
		cursor: wait;
	}

	&:not(:disabled):hover {
		> .inner {
			background: linear-gradient(90deg, var(--X8), var(--X8));
		}
	}

	&:not(:disabled):active {
		> .inner {
			background: linear-gradient(90deg, var(--X8), var(--X8));
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
	color: var(--fgOnAccent);
	background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
	display: flex;
	gap: 6px;
	align-items: center;
	justify-content: center;
}

.headerRightItem {
	margin: 0;
	padding: 8px;
	border-radius: 6px;

	&:hover {
		background: var(--X5);
	}

	&:disabled {
		background: none;
	}

	&.danger {
		color: #ff2a2a;
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
}

.targetNote {
	padding: 0 20px 16px 20px;
}

.withQuote {
	margin: 0 0 8px 0;
	color: var(--accent);
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
	background: var(--X4);
}

.hasNotSpecifiedMentions {
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
	font-size: 16px;
	border: none;
	border-radius: 0;
	background: transparent;
	color: var(--fg);
	font-family: inherit;

	&:focus {
		outline: none;
	}

	&:disabled {
		opacity: 0.5;
	}
}

.cw {
	z-index: 1;
	padding-bottom: 8px;
	border-bottom: solid 0.5px var(--divider);
}

.hashtags {
	z-index: 1;
	padding-top: 8px;
	padding-bottom: 8px;
	border-top: solid 0.5px var(--divider);
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
	color: var(--warn);
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
		background: var(--X5);
	}

	&.footerButtonActive {
		color: var(--accent);
	}
}

.previewButtonActive {
	color: var(--accent);
}

.guidelineInfo {
	margin-top: 8px;
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

@container (max-width: 375px) {
	.submitInner {
		min-width: 20px;
	}

	.submitButtonText {
		display: none;
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
