import { deviceKind } from '@/scripts/device-kind';

const isTouchSupported = 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;

export let isTouchUsing = deviceKind === 'tablet' || deviceKind === 'smartphone';

if (isTouchSupported && !isTouchUsing) {
	window.addEventListener('touchstart', () => {
		// maxTouchPointsなどでの判定だけだと、「タッチ機能付きディスプレイを使っているがマウスでしか操作しない」場合にも
		// タッチで使っていると判定されてしまうため、実際に一度でもタッチされたらtrueにする
		isTouchUsing = true;
	}, { passive: true });
}
