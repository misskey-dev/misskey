import * as consts from './consts.js';
import Stream, { Connection } from './streaming.js';

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
export const rolePolicies = consts.rolePolicies;
export const queueTypes = consts.queueTypes;
export const reversiUpdateKeys = consts.reversiUpdateKeys;

import * as acct from './acct.js';
// api extractor not supported yet
//export * as api from './api.js';
//export * as entities from './entities.js';
import * as api from './api.js';
import * as entities from './entities.js';
import * as note from './note.js';
import { nyaize } from './nyaize.js';
export { api, entities, acct, note, nyaize };

import type { Acct } from './acct.js';
//#region standalone types
import type { Endpoints } from './api.types.js';
import type { IChannelConnection, IStream, StreamEvents } from './streaming.js';
import type { Channels } from './streaming.types.js';

export type {
	Endpoints,
	Channels,
	Acct,
	StreamEvents,
	IStream,
	IChannelConnection,
};
//#endregion
