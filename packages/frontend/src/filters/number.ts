/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { numberFormat } from '@/scripts/intl-const.js';

export default n => n == null ? 'N/A' : numberFormat.format(n);
