/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { emojiRegex as twemojiRegex } from '@misskey-dev/emoji-data/regex';

export const emojiRegex = new RegExp(`(${twemojiRegex.source})`);
