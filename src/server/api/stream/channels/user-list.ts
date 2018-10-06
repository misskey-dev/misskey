import Channel from '../channel';

export default class extends Channel {
	public init = async (params: any) => {
		const listId = params.listId as string;

		// Subscribe stream
		this.subscriber.on(`userListStream:${listId}`, data => {
			this.send(data);
		});
	}
}
