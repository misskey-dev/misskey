/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { numberFormat } from 'frontend-shared/js/intl-const';

export default n => n == null ? 'N/A' : numberFormat.format(n);
