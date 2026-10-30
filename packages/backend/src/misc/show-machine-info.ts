/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import type Logger from '@/logger.js';

export async function showMachineInfo(parentLogger: Logger) {
	const logger = parentLogger.createSubLogger('machine');
	logger.debug(`Hostname: ${os.hostname()}`);
	logger.debug(`Platform: ${process.platform} Arch: ${process.arch}`);
	logger.debug(`CPU: ${os.cpus().length} core MEM: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB (available: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)}GB)`);
}
