/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { NestFactory } from '@nestjs/core';
import { CommandModule } from '@/cli/CommandModule.js';
import { NestLogger } from '@/NestLogger.js';
import { CommandService } from '@/cli/CommandService.js';

process.title = 'Misskey Cli';

Error.stackTraceLimit = Infinity;
EventEmitter.defaultMaxListeners = 128;

const app = await NestFactory.createApplicationContext(CommandModule, {
	logger: new NestLogger(),
});

const commandService = app.get(CommandService);
commandService.ping();
