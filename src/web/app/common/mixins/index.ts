import * as riot from 'riot';

import activateMe from './i';
import activateApi from './api';
import ServerStreamManager from '../scripts/server-stream-manager';

export default (me, stream) => {
	activateMe(me);
	activateApi(me);

	(riot as any).mixin('stream', { stream });

	(riot as any).mixin('server-stream', { serverStream: new ServerStreamManager() });
};
