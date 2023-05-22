import { Endpoints } from './endpoints.types.js';
import Stream, { Connection } from './streaming.js';
import { Channels } from './streaming.types.js';
import { Acct } from './acct.js';
import type { Packed, Def } from './schemas.js';
import * as consts from './consts.js';

export {
	Endpoints,
	Stream,
	Connection as ChannelConnection,
	Channels,
	Acct,
	Packed, Def,
};

export const permissions = consts.permissions;
export const notificationTypes = consts.notificationTypes;
export const obsoleteNotificationTypes = consts.obsoleteNotificationTypes;
export const noteVisibilities = consts.noteVisibilities;
export const mutedNoteReasons = consts.mutedNoteReasons;
export const ffVisibility = consts.ffVisibility;
export const ACHIEVEMENT_TYPES = consts.ACHIEVEMENT_TYPES;

// api extractor not supported yet
//export * as api from './api.js';
//export * as entities from './entities.js';
import * as api from './api.js';
import * as entities from './entities.js';
export { api, entities };
