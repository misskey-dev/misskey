import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Notes } from '../../../../models';

export default class extends Channel {
	public readonly chName = 'userList';
	public static shouldShare = false;
	public static requireCredential = false;

	@autobind
	public async init(params: any) {
		const listId = params.listId as string;

		// Subscribe stream
		this.subscriber.on(`userListStream:${listId}`, async data => {
			// 再パック
			if (data.type == 'note') data.body = await Notes.pack(data.body.id, this.user, {
				detail: true
			});
			this.send(data);
		});
	}
}
