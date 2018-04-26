import Stream from './stream';
import MiOS from '../../mios';

export class UserListStream extends Stream {
	constructor(os: MiOS, me, listId) {
		super(os, 'user-list', {
			i: me.token,
			listId
		});

		(this as any).on('_connected_', () => {
			this.send({
				i: me.token
			});
		});
	}
}
