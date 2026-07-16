/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { LogManager } from './LogManager.js';
import { PrettyConsoleBackend } from './PrettyConsoleBackend.js';

/**
 * プロセス内のすべてのLoggerが共有するLogManagerです。
 * Logger作成後も同じLogManagerを参照するため、出力先の切り替えを一括で反映できます。
 */
export const logManager = new LogManager(new PrettyConsoleBackend());
