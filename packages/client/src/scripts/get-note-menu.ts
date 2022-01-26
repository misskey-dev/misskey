import { Ref } from 'vue';
import * as misskey from 'misskey-js';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import { noteActions } from '@/store';
import { pleaseLogin } from './please-login';

export function getNoteMenu(props: {
	note: misskey.entities.Note;
	menuButton: Ref<HTMLElement>;
	translation: Ref<any>;
	translating: Ref<boolean>;
}) {
	const isRenote = (
		props.note.renote != null &&
		props.note.text == null &&
		props.note.fileIds.length === 0 &&
		props.note.poll == null
	);

	let appearNote = isRenote ? props.note.renote as misskey.entities.Note : props.note;

	function del(): void {
		os.confirm({
			type: 'warning',
			text: i18n.locale.noteDeleteConfirm,
		}).then(({ canceled }) => {
			if (canceled) return;

			os.api('notes/delete', {
				noteId: appearNote.id
			});
		});
	}

	function delEdit(): void {
		os.confirm({
			type: 'warning',
			text: i18n.locale.deleteAndEditConfirm,
		}).then(({ canceled }) => {
			if (canceled) return;

			os.api('notes/delete', {
				noteId: appearNote.id
			});

			os.post({ initialNote: appearNote, renote: appearNote.renote, reply: appearNote.reply, channel: appearNote.channel });
		});
	}

	function toggleFavorite(favorite: boolean): void {
		os.apiWithDialog(favorite ? 'notes/favorites/create' : 'notes/favorites/delete', {
			noteId: appearNote.id
		});
	}

	function toggleWatch(watch: boolean): void {
		os.apiWithDialog(watch ? 'notes/watching/create' : 'notes/watching/delete', {
			noteId: appearNote.id
		});
	}

	function toggleThreadMute(mute: boolean): void {
		os.apiWithDialog(mute ? 'notes/thread-muting/create' : 'notes/thread-muting/delete', {
			noteId: appearNote.id
		});
	}

	function copyContent(): void {
		copyToClipboard(appearNote.text);
		os.success();
	}

	function copyLink(): void {
		copyToClipboard(`${url}/notes/${appearNote.id}`);
		os.success();
	}

	function togglePin(pin: boolean): void {
		os.apiWithDialog(pin ? 'i/pin' : 'i/unpin', {
			noteId: appearNote.id
		}, undefined, null, e => {
			if (e.id === '72dab508-c64d-498f-8740-a8eec1ba385a') {
				os.alert({
					type: 'error',
					text: i18n.locale.pinLimitExceeded
				});
			}
		});
	}

	async function clip(): Promise<void> {
		const clips = await os.api('clips/list');
		os.popupMenu([{
			icon: 'fas fa-plus',
			text: i18n.locale.createNew,
			action: async () => {
				const { canceled, result } = await os.form(i18n.locale.createNewClip, {
					name: {
						type: 'string',
						label: i18n.locale.name
					},
					description: {
						type: 'string',
						required: false,
						multiline: true,
						label: i18n.locale.description
					},
					isPublic: {
						type: 'boolean',
						label: i18n.locale.public,
						default: false
					}
				});
				if (canceled) return;

				const clip = await os.apiWithDialog('clips/create', result);

				os.apiWithDialog('clips/add-note', { clipId: clip.id, noteId: appearNote.id });
			}
		}, null, ...clips.map(clip => ({
			text: clip.name,
			action: () => {
				os.apiWithDialog('clips/add-note', { clipId: clip.id, noteId: appearNote.id });
			}
		}))], props.menuButton.value, {
		}).then(focus);
	}

	async function promote(): Promise<void> {
		const { canceled, result: days } = await os.inputNumber({
			title: i18n.locale.numberOfDays,
		});

		if (canceled) return;

		os.apiWithDialog('admin/promo/create', {
			noteId: appearNote.id,
			expiresAt: Date.now() + (86400000 * days),
		});
	}

	function share(): void {
		navigator.share({
			title: i18n.t('noteOf', { user: appearNote.user.name }),
			text: appearNote.text,
			url: `${url}/notes/${appearNote.id}`,
		});
	}

	async function translate(): Promise<void> {
		if (props.translation.value != null) return;
		props.translating.value = true;
		const res = await os.api('notes/translate', {
			noteId: appearNote.id,
			targetLang: localStorage.getItem('lang') || navigator.language,
		});
		props.translating.value = false;
		props.translation.value = res;
	}

	let menu;
	if ($i) {
		const statePromise = os.api('notes/state', {
			noteId: appearNote.id
		});

		menu = [{
			icon: 'fas fa-copy',
			text: i18n.locale.copyContent,
			action: copyContent
		}, {
			icon: 'fas fa-link',
			text: i18n.locale.copyLink,
			action: copyLink
		}, (appearNote.url || appearNote.uri) ? {
			icon: 'fas fa-external-link-square-alt',
			text: i18n.locale.showOnRemote,
			action: () => {
				window.open(appearNote.url || appearNote.uri, '_blank');
			}
		} : undefined,
		{
			icon: 'fas fa-share-alt',
			text: i18n.locale.share,
			action: share
		},
		instance.translatorAvailable ? {
			icon: 'fas fa-language',
			text: i18n.locale.translate,
			action: translate
		} : undefined,
		null,
		statePromise.then(state => state.isFavorited ? {
			icon: 'fas fa-star',
			text: i18n.locale.unfavorite,
			action: () => toggleFavorite(false)
		} : {
			icon: 'fas fa-star',
			text: i18n.locale.favorite,
			action: () => toggleFavorite(true)
		}),
		{
			icon: 'fas fa-paperclip',
			text: i18n.locale.clip,
			action: () => clip()
		},
		(appearNote.userId != $i.id) ? statePromise.then(state => state.isWatching ? {
			icon: 'fas fa-eye-slash',
			text: i18n.locale.unwatch,
			action: () => toggleWatch(false)
		} : {
			icon: 'fas fa-eye',
			text: i18n.locale.watch,
			action: () => toggleWatch(true)
		}) : undefined,
		statePromise.then(state => state.isMutedThread ? {
			icon: 'fas fa-comment-slash',
			text: i18n.locale.unmuteThread,
			action: () => toggleThreadMute(false)
		} : {
			icon: 'fas fa-comment-slash',
			text: i18n.locale.muteThread,
			action: () => toggleThreadMute(true)
		}),
		appearNote.userId == $i.id ? ($i.pinnedNoteIds || []).includes(appearNote.id) ? {
			icon: 'fas fa-thumbtack',
			text: i18n.locale.unpin,
			action: () => togglePin(false)
		} : {
			icon: 'fas fa-thumbtack',
			text: i18n.locale.pin,
			action: () => togglePin(true)
		} : undefined,
		/*
		...($i.isModerator || $i.isAdmin ? [
			null,
			{
				icon: 'fas fa-bullhorn',
				text: i18n.locale.promote,
				action: promote
			}]
			: []
		),*/
		...(appearNote.userId != $i.id ? [
			null,
			{
				icon: 'fas fa-exclamation-circle',
				text: i18n.locale.reportAbuse,
				action: () => {
					const u = appearNote.url || appearNote.uri || `${url}/notes/${appearNote.id}`;
					os.popup(import('@/components/abuse-report-window.vue'), {
						user: appearNote.user,
						initialComment: `Note: ${u}\n-----\n`
					}, {}, 'closed');
				}
			}]
			: []
		),
		...(appearNote.userId == $i.id || $i.isModerator || $i.isAdmin ? [
			null,
			appearNote.userId == $i.id ? {
				icon: 'fas fa-edit',
				text: i18n.locale.deleteAndEdit,
				action: delEdit
			} : undefined,
			{
				icon: 'fas fa-trash-alt',
				text: i18n.locale.delete,
				danger: true,
				action: del
			}]
			: []
		)]
		.filter(x => x !== undefined);
	} else {
		menu = [{
			icon: 'fas fa-copy',
			text: i18n.locale.copyContent,
			action: copyContent
		}, {
			icon: 'fas fa-link',
			text: i18n.locale.copyLink,
			action: copyLink
		}, (appearNote.url || appearNote.uri) ? {
			icon: 'fas fa-external-link-square-alt',
			text: i18n.locale.showOnRemote,
			action: () => {
				window.open(appearNote.url || appearNote.uri, '_blank');
			}
		} : undefined]
		.filter(x => x !== undefined);
	}

	if (noteActions.length > 0) {
		menu = menu.concat([null, ...noteActions.map(action => ({
			icon: 'fas fa-plug',
			text: action.title,
			action: () => {
				action.handler(appearNote);
			}
		}))]);
	}

	return menu;
}
