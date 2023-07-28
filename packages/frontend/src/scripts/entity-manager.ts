/*
 * SPDX-FileCopyrightText: syuilo, tamaina and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Note, UserLite } from "misskey-js/built/entities";
import { Ref, ref, ComputedRef, computed } from "vue";
import { api } from "./api";
import { useStream } from '@/stream';
import { Stream } from "misskey-js";
import { $i } from "@/account";

export class EntitiyManager<T extends { id: string }> {
    private entities: Map<T['id'], Ref<T>>;

    constructor() {
        this.entities = new Map();
    }

    public set(item: T): Ref<T> {
        const cached = this.entities.get(item.id);
        if (cached) {
            cached.value = item;
        } else {
            this.entities.set(item.id, ref(item) as Ref<T>);
        }
        return this.get(item.id)!;
    }

    public get(id: string): Ref<T> | undefined {
        return this.entities.get(id);
    }
}

export const userLiteManager = new EntitiyManager<UserLite>();

type OmittedNote = Omit<Note, 'user' | 'renote' | 'reply'>;
type CachedNoteSource = Ref<OmittedNote | null>;
type CachedNote = ComputedRef<Note | null>;

/**
 * ノートのキャッシュを管理する
 * 基本的な使い方:
 *   1. setでノートのデータをセットする
 *   2. useNoteでデータを取得+監視
 */
export class NoteManager {
    /**
     * ノートのソースとなるRef
     * user, renote, replyを持たない
     * nullは削除済みであることを表す
     */
    private notesSource: Map<Note['id'], CachedNoteSource>;

    /**
     * ソースからuser, renote, replyを取得したComputedRefのキャッシュを保持しておく
     * nullは削除済みであることを表す
     * キャプチャが0になったら削除される
     */
    private notesComputed: Map<Note['id'], CachedNote>;
    private updatedAt: Map<Note['id'], number>;
    private captureing: Map<Note['id'], number>;
    private connection: Stream | null;

    constructor() {
        this.notesSource = new Map();
        this.notesComputed = new Map();
        this.updatedAt = new Map();
        this.captureing = new Map();
        this.connection = $i ? useStream() : null;
        this.connection?.on('noteUpdated', this.onStreamNoteUpdated);
        this.connection?.on('_connected_', () => {
            // 再接続時に再キャプチャ
            for (const [id, captureingNumber] of Array.from(this.captureing)) {
                if (captureingNumber === 0) {
                    this.captureing.delete(id);
                    continue;
                }

                this.connection?.send('s', { id });
            }
        });
    }

    public set(_note: Note): void {
        const note: Note = { ..._note };
        userLiteManager.set(note.user);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        delete note.user;
        if (note.renote) this.set(note.renote);
        delete note.renote;
        if (note.reply) this.set(note.reply);
        delete note.reply;
        const cached = this.notesSource.get(note.id);
        if (cached) {
            cached.value = note;
        } else {
            this.notesSource.set(note.id, ref(note));
        }
        this.updatedAt.set(note.id, Date.now());
    }

    public get(id: string): CachedNote {
        if (!this.notesComputed.has(id)) {
            const note = this.notesSource.get(id) ?? this.notesSource.set(id, ref(null)).get(id)!;

            this.notesComputed.set(id, computed<Note | null>(() => {
                if (!note.value) return null;

                const user = userLiteManager.get(note.value.userId)!;

                const renote = note.value.renoteId ? this.get(note.value.renoteId) : undefined;
                // renoteが削除されている場合はCASCADE削除されるためnullを返す
                if (renote && !renote.value) return null;

                const reply = note.value.replyId ? this.get(note.value.replyId) : undefined;
                if (reply && !reply.value) return null;

                return {
                    ...note.value,
                    user: user.value,
                    renote: renote?.value ?? undefined,
                    reply: reply?.value ?? undefined,
                };
            }));
        }
        return this.notesComputed.get(id)!;
    }

    public async fetch(id: string, force = false): Promise<CachedNote> {
        if (!force) {
            const updatedAt = this.updatedAt.get(id);
            if (updatedAt && Date.now() - updatedAt < 1000 * 30) {
                const cachedNote = this.get(id);
                if (cachedNote) {
                    return cachedNote;
                }
            }
        }
        return api('notes/show', { noteId: id })
            .then(fetchedNote => {
                this.set(fetchedNote);
                return this.get(id)!;
            })
            .catch(() => {
                // エラーが発生した場合はとりあえず削除されたものとして扱う
                const cached = this.notesSource.get(id);
                if (cached) {
                    cached.value = null;
                } else {
                    this.notesSource.set(id, ref(null));
                }
                // updateAtはしない
                return this.get(id)!;
            });
    }

	private onStreamNoteUpdated(noteData: any): void {
		const { type, id, body } = noteData;

        const note = this.notesSource.get(id);

		if (!note || !note.value) {
            this.connection?.send('un', { id });
            this.captureing.delete(id);
            this.notesComputed.delete(id);
            this.updatedAt.delete(id);
            return;
        }

		switch (type) {
			case 'reacted': {
				const reaction = body.reaction;

				if (body.emoji && !(body.emoji.name in note.value.reactionEmojis)) {
					note.value.reactionEmojis[body.emoji.name] = body.emoji.url;
				}

				// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
				const currentCount = (note.value.reactions || {})[reaction] || 0;

				note.value.reactions[reaction] = currentCount + 1;

				if ($i && (body.userId === $i.id)) {
					note.value.myReaction = reaction;
				}
				break;
			}

			case 'unreacted': {
				const reaction = body.reaction;

				// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
				const currentCount = (note.value.reactions || {})[reaction] || 0;

				note.value.reactions[reaction] = Math.max(0, currentCount - 1);
				if (note.value.reactions[reaction] === 0) delete note.value.reactions[reaction];

				if ($i && (body.userId === $i.id)) {
					note.value.myReaction = undefined;
				}
				break;
			}

			case 'pollVoted': {
				const choice = body.choice;

				const choices = [...note.value.poll!.choices];
				choices[choice] = {
					...choices[choice],
					votes: choices[choice].votes + 1,
					...($i && (body.userId === $i.id) ? {
						isVoted: true,
					} : {}),
				};

				note.value.poll!.choices = choices;
				break;
			}

			case 'deleted': {
				note.value = null;
				break;
			}
		}

        this.updatedAt.set(id, Date.now());
	}

    private capture(id: string, markRead = true): void {
        if (!this.notesSource.has(id)) return;

        const captureingNumber = this.captureing.get(id);
        if (typeof captureingNumber === 'number' && captureingNumber > 0) {
            this.captureing.set(id, captureingNumber + 1);
            return;
        }

        if (this.connection) {
            // TODO: このノートがストリーミング経由で流れてきた場合のみ sr する
            this.connection.send(markRead ? 'sr' : 's', { id });
        }

        this.captureing.set(id, 1);
	}

    private decapture(id: string): void {
        if (!this.notesSource.has(id)) return;

        const captureingNumber = this.captureing.get(id);
        if (typeof captureingNumber === 'number' && captureingNumber > 1) {
            this.captureing.set(id, captureingNumber - 1);
            return;
        }

        if (this.connection) {
            this.connection.send('un', { id });
        }

        this.captureing.delete(id);

        // キャプチャが終わったらcomputedキャッシュも消してしまう
        this.notesComputed.delete(id);
	}

    /**
     * ノートを取得・監視
     * キャプチャが要らなくなったら必ずunuseすること
     * @param id note id
     * @returns { note, unuse } note: CachedNote | Promise<CachedNote>, unuse: () => void
     */
    public useNote(id: string, shoudFetch: true): { note: Promise<CachedNote>, unuse: () => void };
    public useNote(id: string, shoudFetch = false) {
        const note = (!this.notesSource.has(id) || shoudFetch) ? this.fetch(id) : this.get(id)!;
        let using = false;
        const CapturePromise = Promise.resolve(note)
            .then(() => {
                this.capture(id);
                using = true;
            })
            .catch(err => console.error(err));

        const unuse = () => {
            CapturePromise.then(() => {
                if (!using) return;
                this.decapture(id);
                using = false;
            });
        };

        return {
            note,
            unuse,
        };
    }
}

export const noteManager = new NoteManager();
