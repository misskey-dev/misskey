// SafariがBroadcastChannel未実装なのでライブラリを使う
import { BroadcastChannel } from 'broadcast-channel';

export const reloadChannel = new BroadcastChannel<boolean>('reload');

// BroadcastChannelを用いて、クライアントが一斉にreloadするようにします。
export function unisonReload(redirectToRoot?: boolean) {
	reloadChannel.postMessage(!!redirectToRoot);
	reload();
}

export function reload(redirectToRoot?: boolean) {
	if (redirectToRoot) {
		location.href = '/';
	} else {
		location.reload();
	}
}
