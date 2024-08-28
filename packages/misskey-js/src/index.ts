import { type Endpoints } from './api.types.js';
import Stream, { Connection } from './streaming.js';
import { type Channels } from './streaming.types.js';
import { type Acct } from './acct.js';
import * as consts from './consts.js';

export type {
	Endpoints,
	Channels,
	Acct,
};

export {
	Stream,
	Connection as ChannelConnection,
};

export const permissions = consts.permissions;
export const notificationTypes = consts.notificationTypes;
export const noteVisibilities = consts.noteVisibilities;
export const mutedNoteReasons = consts.mutedNoteReasons;
export const followingVisibilities = consts.followingVisibilities;
export const followersVisibilities = consts.followersVisibilities;
export const moderationLogTypes = consts.moderationLogTypes;
export const reversiUpdateKeys = consts.reversiUpdateKeys;

// api extractor not supported yet
//export * as api from './api.js';
//export * as entities from './entities.js';
import * as api from './api.js';
import * as entities from './entities.js';
import * as acct from './acct.js';
import * as note from './note.js';
export { api, entities, acct, note };
