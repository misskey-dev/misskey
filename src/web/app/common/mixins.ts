import * as riot from 'riot';

import MiOS from './mios';
import ServerStreamManager from './scripts/server-stream-manager';
import RequestsStreamManager from './scripts/requests-stream-manager';
import MessagingIndexStream from './scripts/messaging-index-stream-manager';
import DriveStreamManager from './scripts/drive-stream-manager';

export default (mios: MiOS) => {
	(riot as any).mixin('os', {
		mios: mios
	});

	(riot as any).mixin('i', {
		init: function() {
			this.I = mios.i;
			this.SIGNIN = mios.isSignedin;

			if (this.SIGNIN) {
				this.on('mount', () => {
					mios.i.on('updated', this.update);
				});
				this.on('unmount', () => {
					mios.i.off('updated', this.update);
				});
			}
		},
		me: mios.i
	});

	(riot as any).mixin('api', {
		api: mios.api
	});
	(riot as any).mixin('drive-stream', { driveStream: new DriveStreamManager(mios.i) });
	(riot as any).mixin('stream', { stream: mios.stream });

	(riot as any).mixin('server-stream', { serverStream: new ServerStreamManager() });
	(riot as any).mixin('requests-stream', { requestsStream: new RequestsStreamManager() });
	(riot as any).mixin('messaging-index-stream', { messagingIndexStream: new MessagingIndexStream(mios.i) });
};
