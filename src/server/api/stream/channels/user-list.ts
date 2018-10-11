import autobind from 'autobind-decorator';
import Channel from '../channel';

export default class extends Channel {
	public readonly chName = 'userList';
	public readonly shouldShare = false;

	@autobind
	public async init(params: any) {
		const listId = params.listId as string;

		// Subscribe stream
		this.subscriber.on(`userListStream:${listId}`, data => {
			this.send(data);
		});
	}
}
