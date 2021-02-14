// SafariがBroadcastChannel未実装なのでライブラリを使う
import { BroadcastChannel } from 'broadcast-channel';

export const reloadChannel = new BroadcastChannel<'reload'>('reload');

// BroadcastChannelを用いて、クライアントが一斉にreloadするようにします。
export function unisonReload() {
    reloadChannel.postMessage('reload');
    location.reload();
}
