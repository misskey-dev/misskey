/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import type { PropsWithChildren } from '@kitajs/html';

export const comment = `<!--
  _____ _         _
 |     |_|___ ___| |_ ___ _ _
 | | | | |_ -|_ -| '_| -_| | |
 |_|_|_|_|___|___|_,_|___|_  |
                         |___|
 Thank you for using Misskey!
 If you are reading this message... how about joining the development?
 https://github.com/misskey-dev/misskey
-->`;

export const defaultDescription = '✨🌎✨ A interplanetary communication platform ✨🚀✨';

export type CommonProps<T = {}> = PropsWithChildren<{
	version: string;
	config: Config;
}> & T;
