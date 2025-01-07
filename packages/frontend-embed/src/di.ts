/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InjectionKey } from 'vue';
import * as Misskey from 'misskey-js';
import { MediaProxy } from 'frontend-shared/js/media-proxy';
import type { ParsedEmbedParams } from 'frontend-shared/js/embed-page';
import type { ServerContext } from '@/server-context.js';

export const DI = {
	serverMetadata: Symbol() as InjectionKey<Misskey.entities.MetaDetailed>,
	embedParams: Symbol() as InjectionKey<ParsedEmbedParams>,
	serverContext: Symbol() as InjectionKey<ServerContext>,
	mediaProxy: Symbol() as InjectionKey<MediaProxy>,
};
