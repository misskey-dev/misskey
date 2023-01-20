<template>
<div
	v-if="!muted"
	v-show="!isDeleted"
	ref="el"
	v-hotkey="keymap"
	:class="$style.root"
	:tabindex="!isDeleted ? '-1' : null"
>
	<MkNoteSub v-if="appearNote.reply" :note="appearNote.reply" :class="$style.replyTo"/>
	<div v-if="pinned" :class="$style.tip"><i class="ti ti-pin"></i> {{ i18n.ts.pinnedNote }}</div>
	<!--<div v-if="appearNote._prId_" class="tip"><i class="fas fa-bullhorn"></i> {{ i18n.ts.promotion }}<button class="_textButton hide" @click="readPromo()">{{ i18n.ts.hideThisNote }} <i class="ti ti-x"></i></button></div>-->
	<!--<div v-if="appearNote._featuredId_" class="tip"><i class="ti ti-bolt"></i> {{ i18n.ts.featured }}</div>-->
	<div v-if="isRenote" :class="$style.renote">
		<MkAvatar v-once :class="$style.renoteAvatar" :user="note.user" link preview/>
		<i class="ti ti-repeat" style="margin-right: 4px;"></i>
		<I18n :src="i18n.ts.renotedBy" tag="span" :class="$style.renoteText">
			<template #user>
				<MkA v-user-preview="note.userId" :class="$style.renoteUserName" :to="userPage(note.user)">
					<MkUserName :user="note.user"/>
				</MkA>
			</template>
		</I18n>
		<div :class="$style.renoteInfo">
			<button ref="renoteTime" :class="$style.renoteTime" class="_button" @click="showRenoteMenu()">
				<i v-if="isMyRenote" class="ti ti-dots" :class="$style.renoteMenu"></i>
				<MkTime :time="note.createdAt"/>
			</button>
			<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[note.visibility]">
				<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
				<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
				<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
			</span>
			<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['localOnly']"><i class="ti ti-world-off"></i></span>
		</div>
	</div>
	<article :class="$style.article" @contextmenu.stop="onContextmenu">
		<MkAvatar v-once :class="$style.avatar" :user="appearNote.user" link preview/>
		<div :class="$style.main">
			<MkNoteHeader :class="$style.header" :note="appearNote" :mini="true"/>
			<MkInstanceTicker v-if="showTicker" :class="$style.ticker" :instance="appearNote.user.instance"/>
			<div style="container-type: inline-size;">
				<p v-if="appearNote.cw != null" :class="$style.cw">
					<Mfm v-if="appearNote.cw != ''" style="margin-right: 8px;" :text="appearNote.cw" :author="appearNote.user" :i="$i"/>
					<MkCwButton v-model="showContent" :note="appearNote"/>
				</p>
				<div v-show="appearNote.cw == null || showContent" :class="[{ [$style.contentCollapsed]: collapsed }]">
					<div :class="$style.text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ i18n.ts.private }})</span>
						<MkA v-if="appearNote.replyId" :class="$style.replyIcon" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></MkA>
						<Mfm v-if="appearNote.text" v-once :text="appearNote.text" :author="appearNote.user" :i="$i"/>
						<div v-if="translating || translation" :class="$style.translation">
							<MkLoading v-if="translating" mini/>
							<div v-else :class="$style.translated">
								<b>{{ $t('translatedFrom', { x: translation.sourceLang }) }}: </b>
								<Mfm :text="translation.text" :author="appearNote.user" :i="$i"/>
							</div>
						</div>
					</div>
					<div v-if="appearNote.files.length > 0" :class="$style.files">
						<MkMediaList :media-list="appearNote.files"/>
					</div>
					<MkPoll v-if="appearNote.poll" ref="pollViewer" :note="appearNote" :class="$style.poll"/>
					<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="false" :class="$style.urlPreview"/>
					<div v-if="appearNote.renote" :class="$style.quote"><MkNoteSimple :note="appearNote.renote" :class="$style.quoteNote"/></div>
					<button v-if="isLong && collapsed" :class="$style.collapsed" class="_button" @click="collapsed = false">
						<span :class="$style.collapsedLabel">{{ i18n.ts.showMore }}</span>
					</button>
					<button v-else-if="isLong && !collapsed" :class="$style.showLess" class="_button" @click="collapsed = true">
						<span :class="$style.showLessLabel">{{ i18n.ts.showLess }}</span>
					</button>
				</div>
				<MkA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</MkA>
			</div>
			<footer :class="$style.footer">
				<MkReactionsViewer ref="reactionsViewer" :note="appearNote"/>
				<button :class="$style.footerButton" class="_button" @click="reply()">
					<i class="ti ti-arrow-back-up"></i>
					<p v-if="appearNote.repliesCount > 0" :class="$style.footerButtonCount">{{ appearNote.repliesCount }}</p>
				</button>
				<button
					v-if="canRenote"
					ref="renoteButton"
					:class="$style.footerButton"
					class="_button"
					@mousedown="renote()"
				>
					<i class="ti ti-repeat"></i>
					<p v-if="appearNote.renoteCount > 0" :class="$style.footerButtonCount">{{ appearNote.renoteCount }}</p>
				</button>
				<button v-else :class="$style.footerButton" class="_button" disabled>
					<i class="ti ti-ban"></i>
				</button>
				<button v-if="appearNote.myReaction == null" ref="reactButton" :class="$style.footerButton" class="_button" @mousedown="react()">
					<i class="ti ti-plus"></i>
				</button>
				<button v-if="appearNote.myReaction != null" ref="reactButton" :class="$style.footerButton" class="_button" @click="undoReact(appearNote)">
					<i class="ti ti-minus"></i>
				</button>
				<button ref="menuButton" :class="$style.footerButton" class="_button" @mousedown="menu()">
					<i class="ti ti-dots"></i>
				</button>
			</footer>
		</div>
	</article>
</div>
<div v-else :class="$style.muted" @click="muted = false">
	<I18n :src="i18n.ts.userSaysSomething" tag="small">
		<template #name>
			<MkA v-user-preview="appearNote.userId" :to="userPage(appearNote.user)">
				<MkUserName :user="appearNote.user"/>
			</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref, shallowRef, Ref } from 'vue';
import * as mfm from 'mfm-js';
import * as misskey from 'misskey-js';
import MkNoteSub from '@/components/MkNoteSub.vue';
import MkNoteHeader from '@/components/MkNoteHeader.vue';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkReactionsViewer from '@/components/MkReactionsViewer.vue';
import MkMediaList from '@/components/MkMediaList.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import MkPoll from '@/components/MkPoll.vue';
import MkUsersTooltip from '@/components/MkUsersTooltip.vue';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import MkInstanceTicker from '@/components/MkInstanceTicker.vue';
import { pleaseLogin } from '@/scripts/please-login';
import { focusPrev, focusNext } from '@/scripts/focus';
import { checkWordMute } from '@/scripts/check-word-mute';
import { userPage } from '@/filters/user';
import * as os from '@/os';
import { defaultStore, noteViewInterruptors } from '@/store';
import { reactionPicker } from '@/scripts/reaction-picker';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { getNoteMenu } from '@/scripts/get-note-menu';
import { useNoteCapture } from '@/scripts/use-note-capture';
import { deepClone } from '@/scripts/clone';
import { useTooltip } from '@/scripts/use-tooltip';
import { claimAchievement } from '@/scripts/achievements';

const props = defineProps<{
	note: misskey.entities.Note;
	pinned?: boolean;
}>();

const inChannel = inject('inChannel', null);

let note = $ref(deepClone(props.note));

// plugin
if (noteViewInterruptors.length > 0) {
	onMounted(async () => {
		let result = deepClone(note);
		for (const interruptor of noteViewInterruptors) {
			result = await interruptor.handler(result);
		}
		note = result;
	});
}

const isRenote = (
	note.renote != null &&
	note.text == null &&
	note.fileIds.length === 0 &&
	note.poll == null
);

const el = shallowRef<HTMLElement>();
const menuButton = shallowRef<HTMLElement>();
const renoteButton = shallowRef<HTMLElement>();
const renoteTime = shallowRef<HTMLElement>();
const reactButton = shallowRef<HTMLElement>();
let appearNote = $computed(() => isRenote ? note.renote as misskey.entities.Note : note);
const isMyRenote = $i && ($i.id === note.userId);
const showContent = ref(false);
const isLong = (appearNote.cw == null && appearNote.text != null && (
	(appearNote.text.split('\n').length > 9) ||
	(appearNote.text.length > 500)
));
const collapsed = ref(appearNote.cw == null && isLong);
const isDeleted = ref(false);
const muted = ref(checkWordMute(appearNote, $i, defaultStore.state.mutedWords));
const translation = ref(null);
const translating = ref(false);
const urls = appearNote.text ? extractUrlFromMfm(mfm.parse(appearNote.text)) : null;
const showTicker = (defaultStore.state.instanceTicker === 'always') || (defaultStore.state.instanceTicker === 'remote' && appearNote.user.instance);
const canRenote = computed(() => ['public', 'home'].includes(appearNote.visibility) || appearNote.userId === $i.id);

const keymap = {
	'r': () => reply(true),
	'e|a|plus': () => react(true),
	'q': () => renoteButton.value.renote(true),
	'up|k|shift+tab': focusBefore,
	'down|j|tab': focusAfter,
	'esc': blur,
	'm|o': () => menu(true),
	's': () => showContent.value !== showContent.value,
};

useNoteCapture({
	rootEl: el,
	note: $$(appearNote),
	isDeletedRef: isDeleted,
});

useTooltip(renoteButton, async (showing) => {
	const renotes = await os.api('notes/renotes', {
		noteId: appearNote.id,
		limit: 11,
	});

	const users = renotes.map(x => x.user);

	if (users.length < 1) return;

	os.popup(MkUsersTooltip, {
		showing,
		users,
		count: appearNote.renoteCount,
		targetElement: renoteButton.value,
	}, {}, 'closed');
});

function renote(viaKeyboard = false) {
	pleaseLogin();
	os.popupMenu([{
		text: i18n.ts.renote,
		icon: 'ti ti-repeat',
		action: () => {
			os.api('notes/create', {
				renoteId: appearNote.id,
			});
		},
	}, {
		text: i18n.ts.quote,
		icon: 'ti ti-quote',
		action: () => {
			os.post({
				renote: appearNote,
			});
		},
	}], renoteButton.value, {
		viaKeyboard,
	});
}

function reply(viaKeyboard = false): void {
	pleaseLogin();
	os.post({
		reply: appearNote,
		animation: !viaKeyboard,
	}, () => {
		focus();
	});
}

function react(viaKeyboard = false): void {
	pleaseLogin();
	blur();
	reactionPicker.show(reactButton.value, reaction => {
		os.api('notes/reactions/create', {
			noteId: appearNote.id,
			reaction: reaction,
		});
		if (appearNote.text && appearNote.text.length > 100 && (Date.now() - new Date(appearNote.createdAt).getTime() < 1000 * 3)) {
			claimAchievement('reactWithoutRead');
		}
	}, () => {
		focus();
	});
}

function undoReact(note): void {
	const oldReaction = note.myReaction;
	if (!oldReaction) return;
	os.api('notes/reactions/delete', {
		noteId: note.id,
	});
}

const currentClipPage = inject<Ref<misskey.entities.Clip> | null>('currentClipPage', null);

function onContextmenu(ev: MouseEvent): void {
	const isLink = (el: HTMLElement) => {
		if (el.tagName === 'A') return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
	};
	if (isLink(ev.target)) return;
	if (window.getSelection().toString() !== '') return;

	if (defaultStore.state.useReactionPickerForContextMenu) {
		ev.preventDefault();
		react();
	} else {
		os.contextMenu(getNoteMenu({ note: note, translating, translation, menuButton, isDeleted, currentClipPage }), ev).then(focus);
	}
}

function menu(viaKeyboard = false): void {
	os.popupMenu(getNoteMenu({ note: note, translating, translation, menuButton, isDeleted, currentClipPage }), menuButton.value, {
		viaKeyboard,
	}).then(focus);
}

function showRenoteMenu(viaKeyboard = false): void {
	if (!isMyRenote) return;
	os.popupMenu([{
		text: i18n.ts.unrenote,
		icon: 'ti ti-trash',
		danger: true,
		action: () => {
			os.api('notes/delete', {
				noteId: note.id,
			});
			isDeleted.value = true;
		},
	}], renoteTime.value, {
		viaKeyboard: viaKeyboard,
	});
}

function focus() {
	el.value.focus();
}

function blur() {
	el.value.blur();
}

function focusBefore() {
	focusPrev(el.value);
}

function focusAfter() {
	focusNext(el.value);
}

function readPromo() {
	os.api('promo/read', {
		noteId: appearNote.id,
	});
	isDeleted.value = true;
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	transition: box-shadow 0.1s ease;
	font-size: 1.05em;
	overflow: clip;
	contain: content;

	// これらの指定はパフォーマンス向上には有効だが、ノートの高さは一定でないため、
	// 下の方までスクロールすると上のノートの高さがここで決め打ちされたものに変化し、表示しているノートの位置が変わってしまう
	// ノートがマウントされたときに自身の高さを取得し contain-intrinsic-size を設定しなおせばほぼ解決できそうだが、
	// 今度はその処理自体がパフォーマンス低下の原因にならないか懸念される。また、被リアクションでも高さは変化するため、やはり多少のズレは生じる
	// 一度レンダリングされた要素はブラウザがよしなにサイズを覚えておいてくれるような実装になるまで待った方が良さそう(なるのか？)
	//content-visibility: auto;
  //contain-intrinsic-size: 0 128px;

	&:focus-visible {
		outline: none;

		&:after {
			content: "";
			pointer-events: none;
			display: block;
			position: absolute;
			z-index: 10;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: calc(100% - 8px);
			height: calc(100% - 8px);
			border: dashed 1px var(--focus);
			border-radius: var(--radius);
			box-sizing: border-box;
		}
	}

	&:hover > .article > .main > .footer > .footerButton {
		opacity: 1;
	}
}

.tip {
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 24px;
	font-size: 90%;
	white-space: pre;
	color: #d28a3f;
}

.tip + .article {
	padding-top: 8px;
}

.replyTo {
	opacity: 0.7;
	padding-bottom: 0;
}

.renote {
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 28px;
	white-space: pre;
	color: var(--renote);

	& + .article {
		padding-top: 8px;
	}
}

.renoteAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
	border-radius: 6px;
}

.renoteText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.renoteUserName {
	font-weight: bold;
}

.renoteInfo {
	margin-left: auto;
	font-size: 0.9em;
}

.renoteTime {
	flex-shrink: 0;
	color: inherit;
}

.renoteMenu {
	margin-right: 4px;
}

.article {
	display: flex;
	padding: 28px 32px 18px;
}

.avatar {
	flex-shrink: 0;
	display: block !important;
	margin: 0 14px 8px 0;
	width: 58px;
	height: 58px;
	position: sticky !important;
	top: calc(22px + var(--stickyTop, 0px));
	left: 0;
}

.main {
	flex: 1;
	min-width: 0;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.showLess {
	width: 100%;
	margin-top: 1em;
	position: sticky;
	bottom: 1em;
}

.showLessLabel {
	display: inline-block;
	background: var(--popup);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.contentCollapsed {
	position: relative;
	max-height: 9em;
	overflow: clip;
}

.collapsed {
	display: block;
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--panel), var(--X15));

	&:hover > .collapsedLabel {
		background: var(--panelHighlight);
	}
}

.collapsedLabel {
	display: inline-block;
	background: var(--panel);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.text {
	overflow-wrap: break-word;
}

.replyIcon {
	color: var(--accent);
	margin-right: 0.5em;
}

.translation {
	border: solid 0.5px var(--divider);
	border-radius: var(--radius);
	padding: 12px;
	margin-top: 8px;
}

.urlPreview {
	margin-top: 8px;
}

.poll {
	font-size: 80%;
}

.quote {
	padding: 8px 0;
}

.quoteNote {
	padding: 16px;
	border: dashed 1px var(--renote);
	border-radius: 8px;
}

.channel {
	opacity: 0.7;
	font-size: 80%;
}

.footerButton {
	margin: 0;
	padding: 8px;
	opacity: 0.7;

	&:not(:last-child) {
		margin-right: 28px;
	}

	&:hover {
		color: var(--fgHighlighted);
	}
}

.footerButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;
}

@container (max-width: 500px) {
	.root {
		font-size: 0.9em;
	}

	.avatar {
		width: 50px;
		height: 50px;
	}
}

@container (max-width: 450px) {
	.renote {
		padding: 8px 16px 0 16px;
	}

	.tip {
		padding: 8px 16px 0 16px;
	}

	.article {
		padding: 14px 16px 9px;
	}

	.avatar {
		margin: 0 10px 8px 0;
		width: 46px;
		height: 46px;
		top: calc(14px + var(--stickyTop, 0px));
	}
}

@container (max-width: 350px) {
	.footerButton {
		&:not(:last-child) {
			margin-right: 18px;
		}
	}
}

@container (max-width: 300px) {
	.avatar {
		width: 44px;
		height: 44px;
	}

	.footerButton {
		&:not(:last-child) {
			margin-right: 12px;
		}
	}
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}
</style>
