export const reloadChannel = new BroadcastChannel('reload'); // string | null

// BroadcastChannelを用いて、クライアントが一斉にreloadするようにします。
export function unisonReload(path?: string) {
	if (path !== undefined) {
		reloadChannel.postMessage(path);
		location.href = path;
	} else {
		reloadChannel.postMessage(null);
		location.reload();
	}
}
