/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { DaemonModule } from '@/daemons/DaemonModule.js';
import { GlobalModule } from '@/GlobalModule.js';
import { ServerModule } from '@/server/ServerModule.js';

@Module({
	imports: [
		GlobalModule,
		ServerModule,
		DaemonModule,
	],
})
export class MainModule {}
