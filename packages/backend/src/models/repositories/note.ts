import { Note } from '@/models/entities/note.js';
import { db } from '@/db/postgre.js';

export const NoteRepository = db.getRepository(Note);
