import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		const listId = params.listId as string;

		// Subscribe stream
		this.subscriber.on(`user-list-stream:${listId}`, data => {
			this.send(data);
		});
	}
}
