/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import { EventEmitter } from 'eventemitter3';
import type { Ref, ShallowRef } from 'vue';
import { useStream } from '@/stream.js';
import { $i } from '@/i.js';
import { store } from '@/store.js';
import { misskeyApi } from '@/utility/misskey-api.js';

export const noteEvents = new EventEmitter<{
	[`reacted:${string}`]: (ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }) => void;
	[`unreacted:${string}`]: (ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }) => void;
	[`pollVoted:${string}`]: (ctx: { userId: Misskey.entities.User['id']; choice: string; }) => void;
	[`deleted:${string}`]: () => void;
}>();

const fetchEvent = new EventEmitter<{
	[id: string]: Pick<Misskey.entities.Note, 'reactions' | 'reactionEmojis'>;
}>();

const capturedNoteIdMapForPolling = new Map<string, number>();

const CAPTURE_MAX = 30;
const POLLING_INTERVAL = 1000 * 15;

window.setInterval(() => {
	const ids = [...capturedNoteIdMapForPolling.keys()].sort((a, b) => (a > b ? -1 : 1)).slice(0, CAPTURE_MAX); // 新しいものを優先するためにIDで降順ソート
	if (ids.length === 0) return;
	if (window.document.hidden) return;

	// まとめてリクエストするのではなく、個別にHTTPリクエスト投げてCDNにキャッシュさせた方がサーバーの負荷低減には良いかもしれない
	misskeyApi('notes/show-partial-bulk', {
		noteIds: ids,
	}).then((items) => {
		for (const item of items) {
			fetchEvent.emit(item.id, {
				reactions: item.reactions,
				reactionEmojis: item.reactionEmojis,
			});
		}
	});
}, POLLING_INTERVAL);

function pseudoNoteCapture(props: {
	rootEl: ShallowRef<HTMLElement | undefined>;
	note: Ref<Misskey.entities.Note>;
	pureNote: Ref<Misskey.entities.Note>;
	isDeletedRef: Ref<boolean>;
}) {
	const note = props.note;
	const pureNote = props.pureNote;

	function onFetched(data: Pick<Misskey.entities.Note, 'reactions' | 'reactionEmojis'>): void {
		note.value.reactions = data.reactions;
		note.value.reactionCount = Object.values(data.reactions).reduce((a, b) => a + b, 0);
		note.value.reactionEmojis = data.reactionEmojis;
	}

	if (capturedNoteIdMapForPolling.has(note.value.id)) {
		capturedNoteIdMapForPolling.set(note.value.id, capturedNoteIdMapForPolling.get(note.value.id)! + 1);
	} else {
		capturedNoteIdMapForPolling.set(note.value.id, 1);
	}

	fetchEvent.on(note.value.id, onFetched);

	onUnmounted(() => {
		capturedNoteIdMapForPolling.set(note.value.id, capturedNoteIdMapForPolling.get(note.value.id)! - 1);
		if (capturedNoteIdMapForPolling.get(note.value.id) === 0) {
			capturedNoteIdMapForPolling.delete(note.value.id);
		}

		fetchEvent.off(note.value.id, onFetched);
	});
}

function realtimeNoteCapture(props: {
	rootEl: ShallowRef<HTMLElement | undefined>;
	note: Ref<Misskey.entities.Note>;
	pureNote: Ref<Misskey.entities.Note>;
	isDeletedRef: Ref<boolean>;
}): void {
	const note = props.note;
	const pureNote = props.pureNote;
	const connection = useStream();

	function onStreamNoteUpdated(noteData): void {
		const { type, id, body } = noteData;

		if ((id !== note.value.id) && (id !== pureNote.value.id)) return;

		switch (type) {
			case 'reacted': {
				noteEvents.emit(`reacted:${id}`, {
					userId: body.userId,
					reaction: body.reaction,
					emoji: body.emoji,
				});
				break;
			}

			case 'unreacted': {
				noteEvents.emit(`unreacted:${id}`, {
					userId: body.userId,
					reaction: body.reaction,
					emoji: body.emoji,
				});
				break;
			}

			case 'pollVoted': {
				noteEvents.emit(`pollVoted:${id}`, {
					userId: body.userId,
					choice: body.choice,
				});
				break;
			}

			case 'deleted': {
				noteEvents.emit(`deleted:${id}`);
				break;
			}
		}
	}

	function capture(withHandler = false): void {
		// TODO: このノートがストリーミング経由で流れてきた場合のみ sr する
		connection.send(window.document.body.contains(props.rootEl.value ?? null as Node | null) ? 'sr' : 's', { id: note.value.id });
		if (pureNote.value.id !== note.value.id) connection.send('s', { id: pureNote.value.id });
		if (withHandler) connection.on('noteUpdated', onStreamNoteUpdated);
	}

	function decapture(withHandler = false): void {
		connection.send('un', {
			id: note.value.id,
		});
		if (pureNote.value.id !== note.value.id) {
			connection.send('un', {
				id: pureNote.value.id,
			});
		}
		if (withHandler) connection.off('noteUpdated', onStreamNoteUpdated);
	}

	function onStreamConnected() {
		capture(false);
	}

	capture(true);
	connection.on('_connected_', onStreamConnected);

	onUnmounted(() => {
		decapture(true);
		connection.off('_connected_', onStreamConnected);
	});
}

export function useNoteCapture(props: {
	rootEl: ShallowRef<HTMLElement | undefined>;
	note: Ref<Misskey.entities.Note>;
	pureNote: Ref<Misskey.entities.Note>;
	isDeletedRef: Ref<boolean>;
}) {
	const note = props.note;
	noteEvents.on(`reacted:${note.value.id}`, onReacted);
	noteEvents.on(`unreacted:${note.value.id}`, onUnreacted);
	noteEvents.on(`pollVoted:${note.value.id}`, onPollVoted);
	noteEvents.on(`deleted:${note.value.id}`, onDeleted);

	let latestReactedKey: string | null = null;
	let latestUnreactedKey: string | null = null;
	let latestPollVotedKey: string | null = null;

	function onReacted(ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }): void {
		console.log('reacted', ctx);
		const newReactedKey = `${ctx.userId}:${ctx.reaction}`;
		if (newReactedKey === latestReactedKey) return;
		latestReactedKey = newReactedKey;

		if (ctx.emoji && !(ctx.emoji.name in note.value.reactionEmojis)) {
			note.value.reactionEmojis[ctx.emoji.name] = ctx.emoji.url;
		}

		const currentCount = note.value.reactions[ctx.reaction] || 0;

		note.value.reactions[ctx.reaction] = currentCount + 1;
		note.value.reactionCount += 1;

		if ($i && (ctx.userId === $i.id)) {
			note.value.myReaction = ctx.reaction;
		}
	}

	function onUnreacted(ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }): void {
		const newUnreactedKey = `${ctx.userId}:${ctx.reaction}`;
		if (newUnreactedKey === latestUnreactedKey) return;
		latestUnreactedKey = newUnreactedKey;

		const currentCount = note.value.reactions[ctx.reaction] || 0;

		note.value.reactions[ctx.reaction] = Math.max(0, currentCount - 1);
		note.value.reactionCount = Math.max(0, note.value.reactionCount - 1);
		if (note.value.reactions[ctx.reaction] === 0) delete note.value.reactions[ctx.reaction];

		if ($i && (ctx.userId === $i.id)) {
			note.value.myReaction = null;
		}
	}

	function onPollVoted(ctx: { userId: Misskey.entities.User['id']; choice: string; }): void {
		const newPollVotedKey = `${ctx.userId}:${ctx.choice}`;
		if (newPollVotedKey === latestPollVotedKey) return;
		latestPollVotedKey = newPollVotedKey;

		const choices = [...note.value.poll.choices];
		choices[ctx.choice] = {
			...choices[ctx.choice],
			votes: choices[ctx.choice].votes + 1,
			...($i && (ctx.userId === $i.id) ? {
				isVoted: true,
			} : {}),
		};

		note.value.poll.choices = choices;
	}

	function onDeleted(): void {
		props.isDeletedRef.value = true;
	}

	onUnmounted(() => {
		noteEvents.off(`reacted:${note.value.id}`, onReacted);
		noteEvents.off(`unreacted:${note.value.id}`, onUnreacted);
		noteEvents.off(`pollVoted:${note.value.id}`, onPollVoted);
		noteEvents.off(`deleted:${note.value.id}`, onDeleted);
	});

	if ($i && store.s.realtimeMode) {
		realtimeNoteCapture(props);
	} else {
		pseudoNoteCapture(props);
	}
}
