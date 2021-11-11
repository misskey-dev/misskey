import { Endpoints } from './api.types';
import Stream from './streaming';
import { Acct } from './acct';
import { permissions } from './permissions';

export {
	Endpoints,
	Stream,
	Acct,
	permissions,
};

// api extractor not supported yet
//export * as api from './api';
//export * as entities from './entities';
import * as api from './api';
import * as entities from './entities';
export { api, entities };
