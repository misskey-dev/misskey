/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { isLink } from '@@/js/is-link.js';
import { shouldCollapsed } from '@@/js/collapsed.js';
import { host } from '@@/js/config.js';
import { pleaseLogin } from '@/utility/please-login.js';
import type { OpenOnRemoteOptions } from '@/utility/please-login.js';
import { checkWordMute } from '@/utility/check-word-mute.js';
import { misskeyApi, misskeyApiGet } from '@/utility/misskey-api.js';
import * as sound from '@/utility/sound.js';
import * as os from '@/os.js';
import { reactionPicker } from '@/utility/reaction-picker.js';
import { extractUrlFromMfm } from '@/utility/extract-url-from-mfm.js';
import { getNoteClipMenu, getNoteMenu, getRenoteMenu, getAbuseNoteMenu, getCopyNoteLinkMenu } from '@/utility/get-note-menu.js';
import { noteEvents, useNoteCapture } from '@/composables/use-note-capture.js';
import { deepClone } from '@/utility/clone.js';
import { useTooltip } from '@/composables/use-tooltip.js';
import { claimAchievement } from '@/utility/achievements.js';
import { showMovedDialog } from '@/utility/show-moved-dialog.js';
import { getAppearNote } from '@/utility/get-appear-note.js';
import { prefer } from '@/preferences.js';
import { getPluginHandlers } from '@/plugin.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import { globalEvents, useGlobalEvent } from '@/events.js';
import MkUsersTooltip from '@/components/MkUsersTooltip.vue';
import MkReactionsViewerDetails from '@/components/MkReactionsViewer.details.vue';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { notePage } from '@/filters/note.js';
import type { DI as DIType } from '@/di.js';
import type { ExtractInjectedType } from '@/types/misc.js';
import type { MenuItem } from '@/types/menu.js';

export interface UseNoteProps {
	note: Misskey.entities.Note;
	pinned?: boolean;
	mock?: boolean;
	withHardMute?: boolean;
}

export interface UseNoteElements {
	rootEl?: Ref<HTMLElement | null>;
	menuButton?: Ref<HTMLElement | null>;
	renoteButton?: Ref<HTMLElement | null>;
	renoteTime?: Ref<HTMLElement | null>;
	reactButton?: Ref<HTMLElement | null>;
	clipButton?: Ref<HTMLElement | null>;
}

export interface UseNoteOptions {
	inTimeline?: boolean;
	tl_withSensitive?: Ref<boolean>;
	inChannel?: ExtractInjectedType<typeof DIType['inChannel']>;
	currentClip?: Ref<Misskey.entities.Clip | null> | null;
	currentAntenna?: Ref<Misskey.entities.Antenna | null> | null;
}

export function calculateMuteStatus(
	noteToCheck: Misskey.entities.Note,
	user: typeof $i,
	inTimeline: boolean,
	tl_withSensitive: boolean,
	checkOnly = false
): Array<string | string[]> | boolean | 'sensitiveMute' {
	if (user?.mutedWords != null) {
		const result = checkWordMute(noteToCheck, user, user.mutedWords);
		if (Array.isArray(result)) return checkOnly ? (result.length > 0) : result;

		const replyResult = noteToCheck.reply && checkWordMute(noteToCheck.reply, user, user.mutedWords);
		if (Array.isArray(replyResult)) return checkOnly ? (replyResult.length > 0) : replyResult;

		const renoteResult = noteToCheck.renote && checkWordMute(noteToCheck.renote, user, user.mutedWords);
		if (Array.isArray(renoteResult)) return checkOnly ? (renoteResult.length > 0) : renoteResult;
	}

	if (checkOnly) return false;

	if (inTimeline && tl_withSensitive === false && noteToCheck.files?.some((v) => v.isSensitive)) {
		return 'sensitiveMute';
	}

	return false;
}

/** MkNote, MkNoteDetailedの共通ロジック */
export function useNote(
	props: UseNoteProps,
	els: UseNoteElements = {},
	options: UseNoteOptions = {},
) {
	const inTimeline = options.inTimeline ?? false;
	const tl_withSensitive = options.tl_withSensitive ?? ref(true);
	const inChannel = options.inChannel ?? null;
	const currentClip = options.currentClip ?? null;
	const currentAntenna = options.currentAntenna ?? null;

	// プラグインの割り込み処理
	let rawNote = deepClone(props.note);
	const hideByPlugin = ref(false);
	const noteViewInterruptors = getPluginHandlers('note_view_interruptor');

	if (noteViewInterruptors.length > 0) {
		let result: Misskey.entities.Note | null = deepClone(rawNote);
		for (const interruptor of noteViewInterruptors) {
			try {
				result = interruptor.handler(result!) as Misskey.entities.Note | null;
			} catch (err) {
				console.error(err);
			}
		}
		if (result == null) {
			hideByPlugin.value = true;
		} else {
			rawNote = result as Misskey.entities.Note;
		}
	}

	// 基本状態
	const isRenote = Misskey.note.isPureRenote(rawNote);
	const appearNote = getAppearNote(rawNote) ?? rawNote;

	// キャプチャ（ストリーム購読）
	const { $note: $appearNote, subscribe: subscribeManuallyToNoteCapture } = useNoteCapture({
		note: appearNote,
		parentNote: rawNote,
		mock: props.mock,
	});

	// 各種フラグ状態
	const showContent = ref(false);
	const isDeleted = ref(false);
	const translating = ref(false);
	const translation = ref<Misskey.entities.NotesTranslateResponse | null>(null);

	// ミュート判定
	const muted = ref($i ? (options.inTimeline ? calculateMuteStatus(appearNote, $i, inTimeline, tl_withSensitive.value) : checkWordMute(appearNote, $i, $i.mutedWords)) : false);
	const hardMuted = ref(props.withHardMute && $i && calculateMuteStatus(appearNote, $i, inTimeline, tl_withSensitive.value, true));

	// 計算プロパティ (Computed)
	const isMyRenote = computed(() => $i && ($i.id === rawNote.userId));
	const parsed = computed(() => appearNote.text ? mfm.parse(appearNote.text) : null);
	const urls = computed(() => parsed.value ? extractUrlFromMfm(parsed.value).filter((url) => appearNote.renote?.url !== url && appearNote.renote?.uri !== url) : null);
	const isLong = computed(() => shouldCollapsed(appearNote, urls.value ?? []));
	const collapsed = ref(appearNote.cw == null && isLong.value);
	const showTicker = computed(() => (prefer.s.instanceTicker === 'always') || (prefer.s.instanceTicker === 'remote' && appearNote.user.instance));
	const canRenote = computed(() => ['public', 'home'].includes(appearNote.visibility) || (appearNote.visibility === 'followers' && appearNote.userId === $i?.id));
	const renoteCollapsed = ref(prefer.s.collapseRenotes && isRenote && (($i && ($i.id === rawNote.userId || $i.id === appearNote.userId)) || ($appearNote.myReaction != null)));

	const pleaseLoginContext = computed<OpenOnRemoteOptions>(() => ({
		type: 'lookup',
		url: `https://${host}/notes/${appearNote.id}`,
	}));

	// グローバルイベントの監視
	useGlobalEvent('noteDeleted', (noteId) => {
		if (noteId === rawNote.id || noteId === appearNote.id) {
			isDeleted.value = true;
		}
	});

	// ツールチップのセットアップ (Mockでない場合のみ)
	if (!props.mock) {
		if (els.renoteButton != null) {
			useTooltip(els.renoteButton, async (showing) => {
				const renotes = await misskeyApi('notes/renotes', { noteId: appearNote.id, limit: 11 });
				const users = renotes.map(x => x.user);
				if (users.length < 1 || els.renoteButton!.value == null) return;
				const { dispose } = os.popup(MkUsersTooltip, {
					showing,
					users,
					count: appearNote.renoteCount,
					anchorElement: els.renoteButton!.value,
				}, {
					closed: () => dispose(),
				});
			});
		}

		if (appearNote.reactionAcceptance === 'likeOnly' && els.reactButton != null) {
			useTooltip(els.reactButton, async (showing) => {
				const reactions = await misskeyApiGet('notes/reactions', { noteId: appearNote.id, limit: 10, _cacheKey_: $appearNote.reactionCount });
				const users = reactions.map(x => x.user);
				if (users.length < 1 || els.reactButton!.value == null) return;
				const { dispose } = os.popup(MkReactionsViewerDetails, {
					showing,
					reaction: '❤️',
					users,
					count: $appearNote.reactionCount,
					anchorElement: els.reactButton!.value,
				}, {
					closed: () => dispose(),
				});
			});
		}
	}

	// 共通アクション関数群
	async function renote() {
		if (props.mock) return;
		const isLoggedIn = await pleaseLogin({ openOnRemote: pleaseLoginContext.value });
		if (!isLoggedIn) return;
		showMovedDialog();
		if (els.renoteButton == null) return;
		const { menu } = getRenoteMenu({ note: rawNote, renoteButton: els.renoteButton, mock: props.mock });
		os.popupMenu(menu, els.renoteButton.value);
		subscribeManuallyToNoteCapture();
	}

	async function reply() {
		if (props.mock) return;
		const isLoggedIn = await pleaseLogin({ openOnRemote: pleaseLoginContext.value });
		if (!isLoggedIn) return;
		os.post({ reply: appearNote, channel: appearNote.channel }).then(() => { focus(); });
	}

	async function react(customCallback?: (reaction: string) => void) {
		const isLoggedIn = await pleaseLogin({ openOnRemote: pleaseLoginContext.value });
		if (!isLoggedIn) return;
		showMovedDialog();

		if (appearNote.reactionAcceptance === 'likeOnly') {
			sound.playMisskeySfx('reaction');
			if (props.mock) return;
			misskeyApi('notes/reactions/create', { noteId: appearNote.id, reaction: '❤️' }).then(() => {
				noteEvents.emit(`reacted:${appearNote.id}`, { userId: $i!.id, reaction: '❤️' });
			});
			if (els.reactButton != null && els.reactButton.value != null && prefer.s.animation) {
				const rect = els.reactButton.value.getBoundingClientRect();
				const { dispose } = os.popup(MkRippleEffect, { x: rect.left + (els.reactButton.value.offsetWidth / 2), y: rect.top + (els.reactButton.value.offsetHeight / 2) }, { end: () => dispose() });
			}
		} else {
			blur();
			reactionPicker.show(els.reactButton?.value ?? null, rawNote, async (reaction) => {
				if (prefer.s.confirmOnReact) {
					const confirm = await os.confirm({ type: 'question', text: i18n.tsx.reactAreYouSure({ emoji: reaction.replace('@.', '') }) });
					if (confirm.canceled) return;
				}
				sound.playMisskeySfx('reaction');
				if (props.mock) {
					if (customCallback) customCallback(reaction);
					return;
				}
				misskeyApi('notes/reactions/create', { noteId: appearNote.id, reaction: reaction }).then(() => {
					noteEvents.emit(`reacted:${appearNote.id}`, { userId: $i!.id, reaction: reaction });
				});
				if (appearNote.text && appearNote.text.length > 100 && (Date.now() - new Date(appearNote.createdAt).getTime() < 1000 * 3)) {
					claimAchievement('reactWithoutRead');
				}
			}, () => { focus(); });
		}
	}

	function undoReact(): void {
		const oldReaction = $appearNote.myReaction;
		if (!oldReaction) return;
		if (props.mock) return;
		misskeyApi('notes/reactions/delete', { noteId: appearNote.id }).then(() => {
			noteEvents.emit(`unreacted:${appearNote.id}`, { userId: $i!.id, reaction: oldReaction });
		});
	}

	function toggleReact(customMockCallback?: (reaction: string) => void) {
		if ($appearNote.myReaction == null) {
			react(customMockCallback);
		} else {
			if (props.mock && customMockCallback) {
				customMockCallback($appearNote.myReaction);
			} else {
				undoReact();
			}
		}
	}

	function onContextmenu(ev: PointerEvent): void {
		if (props.mock) return;
		if (ev.target && isLink(ev.target as HTMLElement)) return;
		if (window.getSelection()?.toString() !== '') return;

		if (prefer.s.useReactionPickerForContextMenu) {
			ev.preventDefault();
			react();
		} else {
			const { menu, cleanup } = getNoteMenu({ note: rawNote, translating, translation, currentClip: currentClip?.value, currentAntenna: currentAntenna?.value ?? undefined });
			os.contextMenu(menu, ev).then(focus).finally(cleanup);
		}
	}

	function showMenu(): void {
		if (props.mock || els.menuButton == null) return;
		const { menu, cleanup } = getNoteMenu({ note: rawNote, translating, translation, currentClip: currentClip?.value, currentAntenna: currentAntenna?.value ?? undefined });
		os.popupMenu(menu, els.menuButton.value).then(focus).finally(cleanup);
	}

	async function clip(): Promise<void> {
		if (props.mock) return;
		os.popupMenu(await getNoteClipMenu({ note: rawNote, currentClip: currentClip?.value }), els.clipButton?.value).then(focus);
	}

	async function showRenoteMenu() {
		if (props.mock) return;
		const isLoggedIn = await pleaseLogin({ openOnRemote: pleaseLoginContext.value });
		if (!isLoggedIn) return;

		const getUnrenote = () => ({
			text: i18n.ts.unrenote,
			icon: 'ti ti-trash',
			danger: true,
			action: () => {
				misskeyApi('notes/delete', { noteId: rawNote.id }).then(() => { globalEvents.emit('noteDeleted', rawNote.id); });
			},
		});

		const renoteDetailsMenu: MenuItem[] = [{ type: 'link', text: i18n.ts.renoteDetails, icon: 'ti ti-info-circle', to: notePage(rawNote) }];
		if (props.note.channelId != null && (inChannel == null || props.note.channelId !== inChannel.value)) {
			renoteDetailsMenu.push({ type: 'link', text: i18n.ts.viewRenotedChannel, icon: 'ti ti-device-tv', to: `/channels/${props.note.channelId}` });
		}

		const baseMenu: MenuItem[] = [...renoteDetailsMenu, getCopyNoteLinkMenu(rawNote, i18n.ts.copyLinkRenote), { type: 'divider'}];
		if (isMyRenote.value) {
			os.popupMenu([...baseMenu, getUnrenote()], els.renoteTime?.value);
		} else {
			os.popupMenu([...baseMenu, getAbuseNoteMenu(rawNote, i18n.ts.reportAbuseRenote), ...(($i?.isModerator || $i?.isAdmin) ? [getUnrenote()] : [])], els.renoteTime?.value);
		}
	}

	// フォーカス制御
	function focus() { els.rootEl?.value?.focus(); }
	function blur() { els.rootEl?.value?.blur(); }

	return {
		// 状態・データ
		note: rawNote,
		appearNote,
		$appearNote,
		hideByPlugin,
		isRenote,
		showContent,
		isDeleted,
		translating,
		translation,
		muted,
		hardMuted,
		collapsed,
		renoteCollapsed,

		// 計算プロパティ
		isMyRenote,
		parsed,
		urls,
		isLong,
		showTicker,
		canRenote,

		// アクション関数
		renote,
		reply,
		react,
		toggleReact,
		onContextmenu,
		showMenu,
		clip,
		showRenoteMenu,
		focus,
		blur,
	};
}
