import { Container, Service } from 'typedi';
import { NoteService } from './noteService.js';

export const noteService = Container.get(NoteService);
