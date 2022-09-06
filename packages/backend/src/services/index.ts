import { Container, Service } from 'typedi';
import { Notes } from '@/models/index.js';
import { NoteService } from './noteService.js';

Container.set('notesRepository', Notes);
export const noteService = Container.get(NoteService);
