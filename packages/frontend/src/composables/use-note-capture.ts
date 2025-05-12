/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import { EventEmitter } from 'eventemitter3';
import type { Reactive, Ref } from 'vue';
import { useStream } from '@/stream.js';
import { $i } from '@/i.js';
import { store } from '@/store.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { prefer } from '@/preferences.js';
import { globalEvents } from '@/events.js';

export const noteEvents = new EventEmitter<{
	[ev: `reacted:${string}`]: (ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }) => void;
	[ev: `unreacted:${string}`]: (ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }) => void;
	[ev: `pollVoted:${string}`]: (ctx: { userId: Misskey.entities.User['id']; choice: string; }) => void;
}>();

const fetchEvent = new EventEmitter<{
	[id: string]: Pick<Misskey.entities.Note, 'reactions' | 'reactionEmojis'>;
}>();

const pollingQueue = new Map<string, {
	referenceCount: number;
	lastAddedAt: number;
}>();

function pollingEnqueue(note: Pick<Misskey.entities.Note, 'id' | 'createdAt'>) {
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

function pollingDequeue(note: Pick<Misskey.entities.Note, 'id' | 'createdAt'>) {
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
const MIN_POLLING_INTERVAL = 1000 * 10;
const POLLING_INTERVAL =
	prefer.s.pollingInterval === 1 ? MIN_POLLING_INTERVAL * 1.5 * 1.5 :
	prefer.s.pollingInterval === 2 ? MIN_POLLING_INTERVAL * 1.5 :
	prefer.s.pollingInterval === 3 ? MIN_POLLING_INTERVAL :
	MIN_POLLING_INTERVAL;

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
	note: Pick<Misskey.entities.Note, 'id' | 'createdAt'>;
	$note: ReactiveNoteData;
}) {
	const { note, $note } = props;

	function onFetched(data: Pick<Misskey.entities.Note, 'reactions' | 'reactionEmojis'>): void {
		$note.reactions = data.reactions;
		$note.reactionCount = Object.values(data.reactions).reduce((a, b) => a + b, 0);
		$note.reactionEmojis = data.reactionEmojis;
	}

	pollingEnqueue(note);
	fetchEvent.on(note.id, onFetched);

	onUnmounted(() => {
		pollingDequeue(note);
		fetchEvent.off(note.id, onFetched);
	});
}

function realtimeSubscribe(props: {
	note: Pick<Misskey.entities.Note, 'id' | 'createdAt'>;
}): void {
	const note = props.note;
	const connection = useStream();

	function onStreamNoteUpdated(noteData): void {
		const { type, id, body } = noteData;

		if (id !== note.id) return;

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
				globalEvents.emit('noteDeleted', id);
				break;
			}
		}
	}

	function capture(withHandler = false): void {
		connection.send('sr', { id: note.id });
		if (withHandler) connection.on('noteUpdated', onStreamNoteUpdated);
	}

	function decapture(withHandler = false): void {
		connection.send('un', { id: note.id });
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

type ReactiveNoteData = Reactive<{
	reactions: Misskey.entities.Note['reactions'];
	reactionCount: Misskey.entities.Note['reactionCount'];
	reactionEmojis: Misskey.entities.Note['reactionEmojis'];
	myReaction: Misskey.entities.Note['myReaction'];
	pollChoices: NonNullable<Misskey.entities.Note['poll']>['choices'];
}>;

export function useNoteCapture(props: {
	note: Pick<Misskey.entities.Note, 'id' | 'createdAt'>;
	parentNote: Misskey.entities.Note | null;
	$note: ReactiveNoteData;
}): {
	subscribe: () => void;
} {
	const { note, parentNote, $note } = props;

	noteEvents.on(`reacted:${note.id}`, onReacted);
	noteEvents.on(`unreacted:${note.id}`, onUnreacted);
	noteEvents.on(`pollVoted:${note.id}`, onPollVoted);

	let latestReactedKey: string | null = null;
	let latestUnreactedKey: string | null = null;
	let latestPollVotedKey: string | null = null;

	function onReacted(ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }): void {
		const newReactedKey = `${ctx.userId}:${ctx.reaction}`;
		if (newReactedKey === latestReactedKey) return;
		latestReactedKey = newReactedKey;

		if (ctx.emoji && !(ctx.emoji.name in $note.reactionEmojis)) {
			$note.reactionEmojis[ctx.emoji.name] = ctx.emoji.url;
		}

		const currentCount = $note.reactions[ctx.reaction] || 0;

		$note.reactions[ctx.reaction] = currentCount + 1;
		$note.reactionCount += 1;

		if ($i && (ctx.userId === $i.id)) {
			$note.myReaction = ctx.reaction;
		}
	}

	function onUnreacted(ctx: { userId: Misskey.entities.User['id']; reaction: string; emoji?: { name: string; url: string; }; }): void {
		const newUnreactedKey = `${ctx.userId}:${ctx.reaction}`;
		if (newUnreactedKey === latestUnreactedKey) return;
		latestUnreactedKey = newUnreactedKey;

		const currentCount = $note.reactions[ctx.reaction] || 0;

		$note.reactions[ctx.reaction] = Math.max(0, currentCount - 1);
		$note.reactionCount = Math.max(0, $note.reactionCount - 1);
		if ($note.reactions[ctx.reaction] === 0) delete $note.reactions[ctx.reaction];

		if ($i && (ctx.userId === $i.id)) {
			$note.myReaction = null;
		}
	}

	function onPollVoted(ctx: { userId: Misskey.entities.User['id']; choice: string; }): void {
		const newPollVotedKey = `${ctx.userId}:${ctx.choice}`;
		if (newPollVotedKey === latestPollVotedKey) return;
		latestPollVotedKey = newPollVotedKey;

		const choices = [...$note.pollChoices];
		choices[ctx.choice] = {
			...choices[ctx.choice],
			votes: choices[ctx.choice].votes + 1,
			...($i && (ctx.userId === $i.id) ? {
				isVoted: true,
			} : {}),
		};

		$note.pollChoices = choices;
	}

	function subscribe() {
		if ($i && store.s.realtimeMode) {
			realtimeSubscribe(props);
		} else {
			pollingSubscribe(props);
		}
	}

	onUnmounted(() => {
		noteEvents.off(`reacted:${note.id}`, onReacted);
		noteEvents.off(`unreacted:${note.id}`, onUnreacted);
		noteEvents.off(`pollVoted:${note.id}`, onPollVoted);
	});

	// 投稿からある程度経過している(=タイムラインを遡って表示した)ノートは、イベントが発生する可能性が低いためそもそも購読しない
	// ただし「リノートされたばかりの過去のノート」(= parentNoteが存在し、かつparentNoteの投稿日時が最近)はイベント発生が考えられるため購読する
	// TODO: デバイスとサーバーの時計がズレていると不具合の元になるため、ズレを検知して警告を表示するなどのケアが必要かもしれない
	if (parentNote == null) {
		if ((Date.now() - new Date(note.createdAt).getTime()) > 1000 * 60 * 5) { // 5min
			// リノートで表示されているノートでもないし、投稿からある程度経過しているので自動で購読しない
			return {
				subscribe: () => {
					subscribe();
				},
			};
		}
	} else {
		if ((Date.now() - new Date(parentNote.createdAt).getTime()) > 1000 * 60 * 5) { // 5min
			// リノートで表示されているノートだが、リノートされてからある程度経過しているので自動で購読しない
			return {
				subscribe: () => {
					subscribe();
				},
			};
		}
	}

	subscribe();

	return {
		subscribe: () => {
			// すでに購読しているので何もしない
		},
	};
}
