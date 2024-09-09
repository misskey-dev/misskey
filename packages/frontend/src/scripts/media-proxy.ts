/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MediaProxy } from '@@/js/media-proxy.js';
import { url } from '@/config.js';
import { instance } from '@/instance.js';

export const mainMediaProxy = new MediaProxy(instance, url);

export const getProxiedImageUrl = mainMediaProxy.getProxiedImageUrl;

export const getProxiedImageUrlNullable = mainMediaProxy.getProxiedImageUrlNullable;

export const getStaticImageUrl = mainMediaProxy.getStaticImageUrl;
