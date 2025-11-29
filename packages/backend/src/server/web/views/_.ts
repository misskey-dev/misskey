/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';

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

export type CommonData = {
	instanceName: string;
	icon: string | null;
	appleTouchIcon: string | null;
	themeColor: string | null;
	serverErrorImageUrl: string;
	infoImageUrl: string;
	notFoundImageUrl: string;
	instanceUrl: string;
	metaJson: string;
	now: number;
	federationEnabled: boolean;
};

export type CommonPropsMinimum<T = {}> = {
	version: string;
	config: Config;
} & T;

export type CommonProps<T = {}> = CommonPropsMinimum<CommonData & T>;
