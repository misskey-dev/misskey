// SafariがBroadcastChannel未実装なのでライブラリを使う
import { BroadcastChannel } from 'broadcast-channel';

const ch = new BroadcastChannel<boolean | undefined>('reload');

// BroadcastChannelを用いて、クライアントが一斉にreloadするようにします。
export function unisonReload(forcedReload?: boolean) {
    ch.postMessage(forcedReload);
    location.reload(forcedReload as boolean);
}

ch.addEventListener('message', forcedReload => location.reload(forcedReload as boolean));
