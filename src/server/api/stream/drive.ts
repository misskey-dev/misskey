import * as websocket from 'websocket';
import Xev from 'xev';

export default function(request: websocket.request, connection: websocket.connection, subscriber: Xev, user: any): void {
	// Subscribe drive stream
	subscriber.on(`drive-stream:${user._id}`, data => {
		connection.send(JSON.stringify(data));
	});
}
