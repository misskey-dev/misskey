import Stream from './stream';

/**
 * Messaging stream connection
 */
export class MessagingStream extends Stream {
	constructor(me, otherparty) {
		super('messaging', {
			i: me.token,
			otherparty
		});

		(this as any).on('_connected_', () => {
			this.send({
				i: me.token
			});
		});
	}
}
