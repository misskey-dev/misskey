/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { Cache } from '@/scripts/cache.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

export const clipsCache = new Cache<Misskey.entities.Clip[]>(1000 * 60 * 30, () => misskeyApi('clips/list'));
export const rolesCache = new Cache(1000 * 60 * 30, () => misskeyApi('admin/roles/list'));
export const userListsCache = new Cache<Misskey.entities.UserList[]>(1000 * 60 * 30, () => misskeyApi('users/lists/list'));
export const antennasCache = new Cache<Misskey.entities.Antenna[]>(1000 * 60 * 30, () => misskeyApi('antennas/list'));
export const favoritedChannelsCache = new Cache<Misskey.entities.Channel[]>(1000 * 60 * 30, () => misskeyApi('channels/my-favorites', { limit: 100 }));
export const userFavoriteListsCache = new Cache(1000 * 60 * 30, () => misskeyApi('users/lists/list-favorite'));
export const userChannelsCache = new Cache<Misskey.entities.UserChannel[]>(1000 * 60 * 30, () => misskeyApi('channels/owned'));
export const userChannelFollowingsCache = new Cache<Misskey.entities.UserChannelFollowing[]>(1000 * 60 * 30, () => misskeyApi('channels/followed'));
