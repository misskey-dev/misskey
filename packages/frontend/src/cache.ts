/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { Cache } from '@/scripts/cache.js';
import { api } from '@/os.js';

export const clipsCache = new Cache<Misskey.entities.Clip[]>(1000 * 60 * 30, () => api('clips/list'));
export const rolesCache = new Cache(1000 * 60 * 30, () => api('admin/roles/list'));
export const userListsCache = new Cache<Misskey.entities.UserList[]>(1000 * 60 * 30, () => api('users/lists/list'));
export const antennasCache = new Cache<Misskey.entities.Antenna[]>(1000 * 60 * 30, () => api('antennas/list'));
