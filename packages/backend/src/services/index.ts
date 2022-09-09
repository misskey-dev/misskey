import { Container, Service } from 'typedi';
import { NoteCreateService } from './note/NoteCreateService.js';

export const noteCreateService = Container.get(NoteCreateService);
