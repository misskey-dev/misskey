/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { dateTimeFormat } from '@@/js/intl-const.js';

// biome-ignore lint/style/noDefaultExport: historical reason
export default (d: Date | number | undefined) => dateTimeFormat.format(d);
export const dateString = (d: string) => dateTimeFormat.format(new Date(d));
