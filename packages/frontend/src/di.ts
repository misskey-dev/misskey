/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { InjectionKey } from 'vue';
import * as Misskey from 'misskey-js';
import { MediaProxy } from '@@/js/media-proxy.js';

export const DI = {
	serverMetadata: Symbol() as InjectionKey<Misskey.entities.MetaDetailed>,
	mediaProxy: Symbol() as InjectionKey<MediaProxy>,
};
