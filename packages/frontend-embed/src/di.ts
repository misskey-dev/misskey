/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InjectionKey } from 'vue';
import * as Misskey from 'misskey-js';
import { MediaProxy } from '@@/js/media-proxy.js';
import type { ParsedEmbedParams } from '@@/js/embed-page.js';
import type { ServerContext } from '@/server-context.js';

export const DI = {
	serverMetadata: Symbol() as InjectionKey<Misskey.entities.MetaDetailed>,
	embedParams: Symbol() as InjectionKey<ParsedEmbedParams>,
	serverContext: Symbol() as InjectionKey<ServerContext>,
	mediaProxy: Symbol() as InjectionKey<MediaProxy>,
};
