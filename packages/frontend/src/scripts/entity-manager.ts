import { Note, UserLite } from "misskey-js/built/entities";
import { Ref, ref, ComputedRef, computed } from "vue";
import { api } from "./api";

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
type InternalCachedNote = Ref<OmittedNote>;

export class NoteManager {
    private notes: Map<Note['id'], InternalCachedNote>;
    private updatedAt: Map<Note['id'], number>;
    private captureing: Map<Note['id'], number>;

    constructor() {
        this.notes = new Map();
        this.updatedAt = new Map();
        this.captureing = new Map();
    }

    public set(_note: Note): ComputedRef<Note> {
        const note: Note = { ..._note };
        userLiteManager.set(note.user);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        delete note.user;
        if (note.renote) this.set(note.renote);
        delete note.renote;
        if (note.reply) this.set(note.reply);
        delete note.reply;
        const cached = this.notes.get(note.id);
        if (cached) {
            cached.value = note;
        } else {
            this.notes.set(note.id, ref(note));
        }
        this.updatedAt.set(note.id, Date.now());
        return this.get(note.id)!;
    }

    public get(id: string): ComputedRef<Note> | undefined {
        const note: InternalCachedNote | undefined = this.notes.get(id);
        if (!note) return undefined;

        return computed<Note>(() => {
            const user = userLiteManager.get(note.value.userId)!;
            const renote = note.value.renoteId ? this.get(note.value.renoteId) : undefined;
            const reply = note.value.replyId ? this.get(note.value.replyId) : undefined;

            return {
                ...note.value,
                user: user.value,
                renote: renote?.value,
                reply: reply?.value,
            };
        });
    }

    public async fetch(id: string, force = false): Promise<ComputedRef<Note>> {
        if (!force) {
            const updatedAt = this.updatedAt.get(id);
            if (updatedAt && Date.now() - updatedAt < 1000 * 30) {
                const cachedNote = this.get(id);
                if (cachedNote) {
                    return cachedNote as ComputedRef<Note>;
                }
            }
        }
        const fetchedNote = await api('notes/show', { noteId: id });
        return this.set(fetchedNote);
    }
}
