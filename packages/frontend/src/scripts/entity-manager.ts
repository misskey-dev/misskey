/*
 * SPDX-FileCopyrightText: syuilo, tamaina and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Note, UserLite, DriveFile } from "misskey-js/built/entities";
import { Ref, ref, ComputedRef, computed, watch } from "vue";
import { api } from "./api";
import { useStream } from '@/stream';
import { Stream } from "misskey-js";
import { $i } from "@/account";
import { defaultStore, noteViewInterruptors } from '@/store';
import { deepClone } from "./clone";
import { shouldCollapsed } from "./collapsed";
import { extractUrlFromMfm } from "./extract-url-from-mfm";
import * as mfm from 'mfm-js';
import { isDebuggerEnabled } from "@/debug";

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
type CachedNote = Ref<Note | null>;
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
    private notesComputedUnwatch: Map<Note['id'], () => void>;

    private updatedAt: Map<Note['id'], number>;
    private captureing: Map<Note['id'], number>;
    private connection: Stream | null;
    private isDebuggerEnabled: boolean;

    constructor() {
        this.notesSource = new Map();
        this.notesComputed = new Map();
        this.notesComputedUnwatch = new Map();
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

        this.isDebuggerEnabled = isDebuggerEnabled(6865);
    }

    public set(_note: Note): void {
        const note: Note = { ..._note };

        userLiteManager.set(note.user);
        if (this.isDebuggerEnabled) console.log('NoteManager: set user', note.userId, userLiteManager.get(note.userId));
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        delete note.user;

        if (note.fileIds.length > 0) {
            for (const file of note.files) {
                driveFileManager.set(file);
                if (this.isDebuggerEnabled) console.log('NoteManager: set file', file.id, driveFileManager.get(file.id));
            }
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        delete note.files;

        if (note.renote) {
            this.set(note.renote);
            if (this.isDebuggerEnabled) console.log('NoteManager: set renote', note.renoteId);
        }
        delete note.renote;

        if (note.reply) {
            this.set(note.reply);
            if (this.isDebuggerEnabled) console.log('NoteManager: set reply', note.replyId);
        }
        delete note.reply;

        const cached = this.notesSource.get(note.id);
        if (cached) {
            cached.value = note;
            if (this.isDebuggerEnabled) console.log('NoteManager: set note (update)', note.id, cached, note);
        } else {
            this.notesSource.set(note.id, ref(note));
            if (this.isDebuggerEnabled) console.log('NoteManager: set note (new)', note.id, this.notesSource.get(note.id), note);
        }
        this.updatedAt.set(note.id, Date.now());
    }

    public get(id: string): CachedNote {
        if (!this.notesComputed.has(id)) {
            const note = this.notesSource.get(id);

            if (this.isDebuggerEnabled) console.log('NoteManager: get note (new) start', id, note);

            if (!note) {
                throw new Error(`NoteManager: get note (new): ${id} is not found`);
            }

            if (!note.value) {
                if (this.isDebuggerEnabled) console.log('NoteManager: get note (new): deleted', id);
                return ref(null);
            }

            const user = userLiteManager.get(note.value.userId)!;
            const renote = note.value.renoteId ? this.get(note.value.renoteId) : undefined;
            const reply = note.value.replyId ? this.get(note.value.replyId) : undefined;
            const files = note.value.fileIds.map(id => driveFileManager.get(id));

            const buildNote = (): Note | null => {
                if (this.isDebuggerEnabled) console.log('NoteManager: get note (watch): build note', id);

                if (note.value == null) return null;
                if (renote && !renote.value) return null;
                if (reply && !reply.value) return null;

                const result = {
                    ...note.value,
                    user: user.value,
                    renote: renote?.value ?? undefined,
                    reply: reply?.value ?? undefined,
                    files: files.filter(file => file).map(file => (file as Ref<DriveFile>).value),
                };

                if (this.isDebuggerEnabled) console.log('NoteManager: get note (watch): built note (not null)', id, result);

                return result;
            };

            this.notesComputed.set(id, ref(buildNote()));
            this.notesComputedUnwatch.set(id, watch([note, user, renote, reply, ...files], () => {
                if (this.isDebuggerEnabled) console.log('NoteManager: note updated', id);
                const cached = this.notesComputed.get(id);

                if (cached) {
                    if (this.isDebuggerEnabled) console.log('NoteManager: note computed watcher dispatch (cached)', id);
                    cached.value = buildNote();
                } else {
                    if (this.isDebuggerEnabled) console.log('NoteManager: note computed watcher dispatch (not cached)', id);
                    this.deleteComputed(id);
                }
            }));

            if (this.isDebuggerEnabled) console.log('NoteManager: get note (new) result', id, this.notesComputed.get(id), this.notesComputedUnwatch.get(id));
        } else {
            if (this.isDebuggerEnabled) console.log('NoteManager: get note (cached)', id, this.notesComputed.get(id), this.notesSource.get(id)?.value);
        }
        return this.notesComputed.get(id)!;
    }

    public deleteComputed(id: string): void {
        const unwatch = this.notesComputedUnwatch.get(id);
        if (this.isDebuggerEnabled) {
            const cached = this.notesComputed.get(id);
            console.log('NoteManager: deleteComputed', id, { cached, unwatch });
        }
        this.notesComputed.delete(id);
        if (unwatch) {
            unwatch();
            this.notesComputedUnwatch.delete(id);
        }
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

        if (this.isDebuggerEnabled) {
            console.log('NoteManager: get interrupted note (new)', id, interruptedNote);
        }

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

        if (this.isDebuggerEnabled) {
            console.log('NoteManager: get note view base (new)', id, { note, noteIsRenote, isMyRenote, appearNote });
        }

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
        if (this.isDebuggerEnabled) console.log('NoteManager: fetch note', id, { force });

        if (!force) {
            const cachedNote = this.get(id);
            if (cachedNote.value === null) {
                // 削除されている場合はnullを返す
                if (this.isDebuggerEnabled) console.log('NoteManager: fetch note (deleted)', id, cachedNote.value);
                return cachedNote;
            }
            // Renoteの場合はRenote元の更新日時も考慮する
            const updatedAt = isRenote(cachedNote.value) ?
                this.updatedAt.get(id) :
                Math.max(this.updatedAt.get(id) ?? 0, this.updatedAt.get(cachedNote.value!.renoteId!) ?? 0);
            // 2分以上経過していない場合はキャッシュを返す
            if (cachedNote && updatedAt && Date.now() - updatedAt < 1000 * 120) {
                if (this.isDebuggerEnabled) console.log('NoteManager: fetch note (use cache)', id, { cachedNote, updatedAt });
                return cachedNote;
            }
        }
        if (this.isDebuggerEnabled) console.log('NoteManager: fetch note (fetch)', id);
        return api('notes/show', { noteId: id })
            .then(fetchedNote => {
                if (this.isDebuggerEnabled) console.log('NoteManager: fetch note (success)', id, fetchedNote);
                this.set(fetchedNote);
                return this.get(id)!;
            })
            .catch(err => {
                if (this.isDebuggerEnabled) {
                    console.error('NoteManager: fetch note (error)', id, err);
                }
                // エラーが発生した場合は何もしない
                return this.get(id)!;
            });
    }

	private onStreamNoteUpdated(noteData: any): void {
		const { type, id, body } = noteData;

        const note = this.notesSource.get(id);

        if (this.isDebuggerEnabled) console.log('NoteManager: onStreamNoteUpdated', noteData);

		if (!note || !note.value) {
            if (this.isDebuggerEnabled) console.log('NoteManager: onStreamNoteUpdated (not found)', note, note?.value);
            this.connection?.send('un', { id });
            this.captureing.delete(id);
            this.deleteComputed(id);
            this.updatedAt.delete(id);
            return;
        } else {
            if (this.isDebuggerEnabled) console.log('NoteManager: onStreamNoteUpdated (found)', note.value);
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
                this.deleteComputed(id);
                this.updatedAt.delete(id);
				break;
			}
		}

        this.updatedAt.set(id, Date.now());
	}

    private capture(id: string, markRead = true): void {
        if (this.isDebuggerEnabled) console.log('NoteManager: capture', id, { has: this.notesSource.has(id), markRead, count: this.captureing.get(id) });

        if (!this.notesSource.has(id)) return;

        const captureingCount = this.captureing.get(id);
        if (typeof captureingCount === 'number' && captureingCount > 0) {
            this.captureing.set(id, captureingCount + 1);
            return;
        }

        if (this.connection) {
            // TODO: このノートがストリーミング経由で流れてきた場合のみ sr する
            this.connection.send(markRead ? 'sr' : 's', { id });
        }

        this.captureing.set(id, 1);
	}

    private decapture(id: string, noDeletion = false): void {
        if (this.isDebuggerEnabled) console.log('NoteManager: decapture', id, { has: this.notesSource.has(id), noDeletion, count: this.captureing.get(id) });

        if (!this.notesSource.has(id)) return;

        const captureingCount = this.captureing.get(id);
        if (typeof captureingCount === 'number' && captureingCount > 1) {
            this.captureing.set(id, captureingCount - 1);
            return;
        }

        if (this.connection) {
            this.connection.send('un', { id });
        }

        this.captureing.delete(id);

        // キャプチャが終わったらcomputedキャッシュも消してしまう
        if (!noDeletion) {
            this.deleteComputed(id);
        }
	}

    /**
     * ノートを取得・監視
     * キャプチャが要らなくなったら必ずunuseすること
     * @param id note id
     * @returns { note, unuse } note: CachedNote | Promise<CachedNote>, unuse: (noDeletion?: boolean) => void
     */
    public useNote(id: string, shoudFetch: true): { note: Promise<CachedNote>, unuse: (noDeletion?: boolean) => void };
    public useNote(id: string, shoudFetch = false) {
        if (this.isDebuggerEnabled) console.log('NoteManager: useNote', id, { has: this.notesSource.has(id), shoudFetch });

        const note = (!this.notesSource.has(id) || shoudFetch) ? this.fetch(id) : this.get(id)!;
        let using = false;
        const CapturePromise = Promise.resolve(note)
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                if (this.isDebuggerEnabled) console.log('NoteManager: useNote: CapturePromise.finally 1', id);
                this.capture(id);
                using = true;
            });

        const unuse = (noDeletion = false) => {
            CapturePromise.finally(() => {
                if (this.isDebuggerEnabled) console.log('NoteManager: useNote: unuse', id, { using, noDeletion });
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
    console.log('NoteManager: entity manager initialized', {
        noteManager,
        userLiteManager,
        driveFileManager,
    });
}
