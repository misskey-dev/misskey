import * as misskey from 'misskey-js';
import { Cache } from '@/scripts/cache';

export const clipsCache = new Cache<misskey.entities.Clip[]>(Infinity);
export const rolesCache = new Cache(Infinity);
export const userListsCache = new Cache<misskey.entities.UserList[]>(Infinity);
