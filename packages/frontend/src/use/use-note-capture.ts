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
	[ev: `reacted:${string}`]: (ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }) => void;
	[ev: `unreacted:${string}`]: (ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }) => void;
	[ev: `pollVoted:${string}`]: (ctx: { userId: Misskey.entities.User['id']; choice: string; }) => void;
	[ev: `deleted:${string}`]: () => void;
}>();

const fetchEvent = new EventEmitter<{
	[id: string]: Pick<Misskey.entities.Note, 'reactions' | 'reactionEmojis'>;
}>();

const pollingQueue = new Map<string, {
	referenceCount: number;
	lastAddedAt: number;
}>();

function pollingEnqueue(note: Misskey.entities.Note) {
	if (pollingQueue.has(note.id)) {
		const data = pollingQueue.get(note.id)!;
		pollingQueue.set(note.id, {
			...data,
			referenceCount: data.referenceCount + 1,
			lastAddedAt: Date.now(),
		});
	} else {
		pollingQueue.set(note.id, {
			referenceCount: 1,
			lastAddedAt: Date.now(),
		});
	}
}

function pollingDequeue(note: Misskey.entities.Note) {
	const data = pollingQueue.get(note.id);
	if (data == null) return;

	if (data.referenceCount === 1) {
		pollingQueue.delete(note.id);
	} else {
		pollingQueue.set(note.id, {
			...data,
			referenceCount: data.referenceCount - 1,
		});
	}
}

const CAPTURE_MAX = 30;
const POLLING_INTERVAL = 1000 * 15;

window.setInterval(() => {
	const ids = [...pollingQueue.entries()]
		.filter(([k, v]) => Date.now() - v.lastAddedAt < 1000 * 60 * 5) // 追加されてから一定時間経過したものは省く
		.map(([k, v]) => k)
		.sort((a, b) => (a > b ? -1 : 1)) // 新しいものを優先するためにIDで降順ソート
		.slice(0, CAPTURE_MAX);

	if (ids.length === 0) return;
	if (window.document.hidden) return;

	// まとめてリクエストするのではなく、個別にHTTPリクエスト投げてCDNにキャッシュさせた方がサーバーの負荷低減には良いかもしれない？
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

function pollingSubscribe(props: {
	note: Ref<Misskey.entities.Note>;
	isDeletedRef: Ref<boolean>;
}) {
	const note = props.note;

	function onFetched(data: Pick<Misskey.entities.Note, 'reactions' | 'reactionEmojis'>): void {
		note.value.reactions = data.reactions;
		note.value.reactionCount = Object.values(data.reactions).reduce((a, b) => a + b, 0);
		note.value.reactionEmojis = data.reactionEmojis;
	}

	pollingEnqueue(note.value);
	fetchEvent.on(note.value.id, onFetched);

	onUnmounted(() => {
		pollingDequeue(note.value);
		fetchEvent.off(note.value.id, onFetched);
	});
}

function realtimeSubscribe(props: {
	note: Ref<Misskey.entities.Note>;
	isDeletedRef: Ref<boolean>;
}): void {
	const note = props.note;
	const connection = useStream();

	function onStreamNoteUpdated(noteData): void {
		const { type, id, body } = noteData;

		if (id !== note.value.id) return;

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
		connection.send('sr', { id: note.value.id });
		if (withHandler) connection.on('noteUpdated', onStreamNoteUpdated);
	}

	function decapture(withHandler = false): void {
		connection.send('un', { id: note.value.id });
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
	note: Ref<Misskey.entities.Note>;
	parentNote: Ref<Misskey.entities.Note> | null;
	isDeletedRef: Ref<boolean>;
}) {
	const note = props.note;
	const parentNote = props.parentNote;

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

	// 投稿からある程度経過している(=タイムラインを遡って表示した)ノートは、イベントが発生する可能性が低いためそもそも購読しない
	// ただし「リノートされたばかりの過去のノート」(= parentNoteが存在し、かつparentNoteの投稿日時が最近)はイベント発生が考えられるため購読する
	// TODO: デバイスとサーバーの時計がズレていると不具合の元になるため、ズレを検知して警告を表示するなどのケアが必要かもしれない
	if (parentNote == null) {
		if ((Date.now() - new Date(note.value.createdAt).getTime()) > 1000 * 60 * 5) { // 5min
			// リノートで表示されているノートでもないし、投稿からある程度経過しているので購読しない
			return;
		}
	} else {
		if ((Date.now() - new Date(parentNote.value.createdAt).getTime()) > 1000 * 60 * 5) { // 5min
			// リノートで表示されているノートだが、リノートされてからある程度経過しているので購読しない
			return;
		}
	}

	if ($i && store.s.realtimeMode) {
		realtimeSubscribe(props);
	} else {
		pollingSubscribe(props);
	}
}
