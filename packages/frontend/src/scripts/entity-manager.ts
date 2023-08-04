/*
 * SPDX-FileCopyrightText: syuilo, tamaina and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Note, UserLite, DriveFile } from "misskey-js/built/entities";
import { Ref, ref, ComputedRef, computed, watch, unref } from "vue";
import { api } from "./api";
import { useStream } from '@/stream';
import { Stream } from "misskey-js";
import { $i } from "@/account";
import { defaultStore, noteViewInterruptors } from '@/store';
import { deepClone } from "./clone";
import { shouldCollapsed } from "./collapsed";
import { extractUrlFromMfm } from "./extract-url-from-mfm";
import * as mfm from 'mfm-js';

export class EntitiyManager<T extends { id: string }> {
    private entities: Map<T['id'], Ref<T>>;

    constructor(
        public key: string,
    ) {
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

export const userLiteManager = new EntitiyManager<UserLite>('userLite');
export const driveFileManager = new EntitiyManager<DriveFile>('driveFile');

type OmittedNote = Omit<Note, 'user' | 'renote' | 'reply'>;
type CachedNoteSource = Ref<OmittedNote | null>;
type CachedNote = ComputedRef<Note | null>;
type InterruptedCachedNote = Ref<Note | null>;

export function isRenote(note: Note | OmittedNote | null): boolean {
    return note != null &&
        note.renoteId != null &&
        note.text == null &&
        note.fileIds?.length === 0 &&
        note.poll == null;
}

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
     * 
     * 削除する機構はないので溜まる一方だが、メモリ使用量はそこまで気にしなくて良さそう
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
        this.connection?.on('noteUpdated', noteData => this.onStreamNoteUpdated(noteData));
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

        if (note.fileIds.length > 0) {
            for (const file of note.files) {
                driveFileManager.set(file);
            }
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        delete note.files;

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

                const files = note.value.fileIds.map(id => driveFileManager.get(id)?.value);

                return {
                    ...note.value,
                    user: user.value,
                    renote: renote?.value ?? undefined,
                    reply: reply?.value ?? undefined,
                    files: files.filter(file => file) as DriveFile[],
                };
            }));
        }
        return this.notesComputed.get(id)!;
    }

    /**
     * Interruptorを適用する
     * 管理が面倒なのでキャッシュはしない
     */
    public getInterrupted(id: string): {
        interruptedNote: InterruptedCachedNote,
        interruptorUnwatch: () => void,
        executeInterruptor: () => Promise<void>,
    } {
        const note = this.get(id);
        const interruptedNote = ref<Note | null>(note.value);

        async function executeInterruptor() {
            if (note.value == null) {
                interruptedNote.value = null;
                return;
            }

            if (noteViewInterruptors.length === 0) {
                interruptedNote.value = note.value;
                return;
            }

            let result = deepClone(note.value);
            for (const interruptor of noteViewInterruptors) {
                result = await interruptor.handler(result) as Note;
            }
            interruptedNote.value = result;
        }
        const interruptorUnwatch = watch(note, executeInterruptor);

        return {
            interruptedNote,
            interruptorUnwatch,
            executeInterruptor,
        };
    }

    /**
     * ノートの表示に必要なデータをお膳立てする
     */
    public getNoteViewBase(id: string) {
        const { interruptedNote: note, interruptorUnwatch, executeInterruptor } = this.getInterrupted(id);
        const noteIsRenote = computed(() => isRenote(note.value));
        const isMyRenote = computed(() => noteIsRenote.value && $i && ($i.id === note.value?.userId));
        const appearNote = computed(() => (noteIsRenote.value ? note.value?.renote : note.value) ?? null);

        return {
            note, interruptorUnwatch, executeInterruptor,
            isRenote: noteIsRenote, isMyRenote, appearNote,
            urls: computed(() => appearNote.value?.text ? extractUrlFromMfm(mfm.parse(appearNote.value.text)) : null),
            isLong: computed(() => appearNote.value ? shouldCollapsed(appearNote.value) : false),
            canRenote: computed(() => (!!appearNote.value && !!$i) && (['public', 'home'].includes(appearNote.value.visibility) || appearNote.value.userId === $i.id)),
            showTicker: computed(() => !!appearNote.value && ((defaultStore.state.instanceTicker === 'always') || (defaultStore.state.instanceTicker === 'remote' && appearNote.value.user.instance))),
        };
    }

    public async fetch(id: string, force = false): Promise<CachedNote> {
        if (!force) {
            const cachedNote = this.get(id);
            if (cachedNote.value === null) {
                // 削除されている場合はnullを返す
                return cachedNote;
            }
            // Renoteの場合はRenote元の更新日時も考慮する
            const updatedAt = isRenote(cachedNote.value) ?
                this.updatedAt.get(id) :
                Math.max(this.updatedAt.get(id) ?? 0, this.updatedAt.get(cachedNote.value!.renoteId!) ?? 0);
            // 2分以上経過していない場合はキャッシュを返す
            if (updatedAt && Date.now() - updatedAt < 1000 * 120) {
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
                // エラーが発生した場合は何もしない
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
                    note.value.reactionEmojis = {
                        ...note.value.reactionEmojis,
                        [body.emoji.name]: body.emoji.url,
                    };
                }

                if (reaction in note.value.reactions) {
                    note.value.reactions[reaction]++;
                } else {
                    note.value.reactions = {
                        ...note.value.reactions,
                        [reaction]: 1,
                    };
                }

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
                this.connection?.send('un', { id });
                this.captureing.delete(id);
                this.notesComputed.delete(id);
                this.updatedAt.delete(id);
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

    private decapture(id: string, noDeletion = false): void {
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
        if (!noDeletion) this.notesComputed.delete(id);
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
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                this.capture(id);
                using = true;
            });

        const unuse = (noDeletion = false) => {
            CapturePromise.then(() => {
                if (!using) return;
                this.decapture(id, noDeletion);
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

if (_DEV_) {
    console.log('entity manager initialized', {
        noteManager,
        userLiteManager,
        driveFileManager,
    });
}
