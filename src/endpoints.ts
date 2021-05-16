import { ID, InstanceMetadata, Note, OriginType, Page, ServerInfo, Stats, User, UserSorting } from './entities';

type TODO = Record<string, any>;

type ShowUserReq = { username: string; host?: string; } | { userId: ID; };

export type Endpoints = {
	// admin

	// announcements
	'announcements': { req: { limit?: number; withUnreads?: boolean; sinceId?: ID; untilId?: ID; }; res: TODO; };

	// antennas
	'antennas/create': { req: TODO; res: TODO; };

	// ap

	// app

	// auth

	// blocking

	// channnels

	// charts

	// clips

	// drive
	'drive': { req: null; res: { capacity: number; usage: number; }; };

	// federation

	// following

	// gallery

	// games

	// get-online-users-count

	// hashtags

	// i
	'i': { req: TODO; res: User; };

	// messaging

	// meta
	'meta': { req: { detail?: boolean; }; res: InstanceMetadata; };

	// miauth

	// mute

	// my

	// notes
	'notes': { req: { limit?: number; sinceId?: ID; untilId?: ID; }; res: Note[]; };
	'notes/create': { req: TODO; res: { createdNote: Note }; };
	'notes/delete': { req: { noteId: ID; }; res: null; };
	'notes/show': { req: { noteId: ID; }; res: Note; };

	// notifications

	// page-push
	'page-push': { req: { pageId: ID; event: string; var?: any; }; res: null; };

	// pages
	'pages/create': { req: TODO; res: Page; };
	'pages/delete': { req: { pageId: ID; }; res: null; };
	'pages/featured': { req: null; res: Page[]; };
	'pages/like': { req: { pageId: ID; }; res: null; };
	'pages/show': { req: { pageId?: ID; name?: string; username?: string; }; res: Page; };
	'pages/unlike': { req: { pageId: ID; }; res: null; };
	'pages/update': { req: TODO; res: null; };

	// ping

	// pinned-users

	// promo

	// request-reset-password

	// reset-password
	'reset-password': { req: { token: string; password: string; }; res: null; };

	// room

	// stats
	'stats': { req: null; res: Stats; };

	// server-info
	'server-info': { req: null; res: ServerInfo; };

	// sw

	// username

	// users
	'users': { req: { limit?: number; offset?: number; sort?: UserSorting; origin?: OriginType; }; res: User[]; };
	'users/show': { req: ShowUserReq; res: User; } | { req: { userIds: ID[]; }; res: User[]; };
};
