import { Endpoints } from './api.types';
import Stream, { Connection } from './streaming';
import { Channels } from './streaming.types';
import { Acct } from './acct';
import * as consts from './consts';

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
export const ffVisibility = consts.ffVisibility;

// api extractor not supported yet
//export * as api from './api';
//export * as entities from './entities';
import * as api from './api';
import * as entities from './entities';
export { api, entities };
