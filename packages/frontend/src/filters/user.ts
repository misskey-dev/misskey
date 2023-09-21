/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import * as Misskey from 'misskey-js';
import { url } from '@/config.js';

export const acct = (user: misskey.Acct) => {
	return Misskey.acct.toString(user);
};

export const userName = (user: Misskey.entities.User) => {
	return user.name || user.username;
};

export const userPage = (user: misskey.Acct, path?, absolute = false) => {
	return `${absolute ? url : ''}/@${acct(user)}${(path ? `/${path}` : '')}`;
};
