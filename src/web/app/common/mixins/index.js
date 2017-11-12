import * as riot from 'riot';

import activateMe from './i';
import activateApi from './api';

export default (me, stream, serverStreamManager) => {
	activateMe(me);
	activateApi(me);

	riot.mixin('stream', { stream });

	riot.mixin('server-stream', { serverStream: serverStreamManager });
};
