import { Endpoints } from './api.types.js';
import Stream, { Connection } from './streaming.js';
import { Channels } from './streaming.types.js';
import { Acct } from './acct.js';
import * as consts from './consts.js';

export {
	Endpoints,
	Stream,
	Connection as ChannelConnection,
	Channels,
	Acct,
};

export const permissions = consts.permissions;
export const notificationTypes = consts.notificationTypes;
export const noteVisibilities = consts.noteVisibilities;
export const mutedNoteReasons = consts.mutedNoteReasons;
export const followingVisibilities = consts.followingVisibilities;
export const followersVisibilities = consts.followersVisibilities;
export const moderationLogTypes = consts.moderationLogTypes;

// api extractor not supported yet
//export * as api from './api.js';
//export * as entities from './entities.js';
import * as api from './api.js';
import * as entities from './entities.js';
import * as acct from './acct.js';
export { api, entities, acct };
