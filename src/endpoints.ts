import { Instance, User } from './types';

type TODO = Record<string, any>;

export type Endpoints = {
	'i': { req: TODO; res: User; };
	'meta': { req: { detail?: boolean; }; res: Instance; };
};
