/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { protectProperties } from 'jest-util';

protectProperties(ReadableStreamDefaultReader);
protectProperties(ReadableStreamBYOBReader);
protectProperties(WritableStreamDefaultWriter);
