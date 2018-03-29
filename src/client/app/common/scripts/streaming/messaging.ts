import Stream from './stream';
import MiOS from '../../mios';

/**
 * Messaging stream connection
 */
export class MessagingStream extends Stream {
	constructor(os: MiOS, me, otherparty) {
		super(os, 'messaging', {
			i: me.account.token,
			otherparty
		});

		(this as any).on('_connected_', () => {
			this.send({
				i: me.account.token
			});
		});
	}
}
