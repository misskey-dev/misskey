/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { init } from 'slacc';
import { builtinEnvironments } from 'vitest/runtime';

init(1);

export default builtinEnvironments.node;
