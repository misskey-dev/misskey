import * as websocket from 'websocket';
import Xev from 'xev';
import { ParsedUrlQuery } from 'querystring';

export default function(request: websocket.request, connection: websocket.connection, subscriber: Xev, user: any): void {
	const q = request.resourceURL.query as ParsedUrlQuery;
	const listId = q.listId as string;

	// Subscribe stream
	subscriber.on(`user-list-stream:${listId}`, data => {
		connection.send(JSON.stringify(data));
	});
}
