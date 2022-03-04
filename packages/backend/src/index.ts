/**
 * Misskey Entry Point!
 */

import { EventEmitter } from 'node:events';
import boot from './boot/index.js';

Error.stackTraceLimit = Infinity;
EventEmitter.defaultMaxListeners = 128;

boot().catch(err => {
	console.error(err);
});
