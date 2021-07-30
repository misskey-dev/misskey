import { Endpoints } from './api.types';
import Stream from './streaming';
import { Acct } from './acct';

export {
	Endpoints,
	Stream,
	Acct
};

// api extractor not supported yet
//export * as api from './api';
//export * as entities from './entities';
import * as api from './api';
import * as entities from './entities';
export { api, entities };
