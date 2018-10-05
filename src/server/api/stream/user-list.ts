import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		const listId = params.listId as string;

		// Subscribe stream
		subscriber.on(`user-list-stream:${listId}`, data => {
			connection.send(JSON.stringify(data));
		});
	}
}
