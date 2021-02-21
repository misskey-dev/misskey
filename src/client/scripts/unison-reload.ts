// SafariがBroadcastChannel未実装なのでライブラリを使う
import { BroadcastChannel } from 'broadcast-channel';

export const reloadChannel = new BroadcastChannel<boolean>('reload');

// BroadcastChannelを用いて、クライアントが一斉にreloadするようにします。
export function unisonReload(redirectToRoot: boolean = false) {
	reloadChannel.postMessage(!!redirectToRoot);
	reload();
}

export function reload(redirectToRoot: boolean = false) {
	if (redirectToRoot) {
		location.href = '/';
	} else {
		location.reload();
	}
}
