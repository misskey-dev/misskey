const isTouchSupported = 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;

export let isTouchUsing = false;

export let isScreenTouching = false;

if (isTouchSupported) {
	window.addEventListener('touchstart', () => {
		// maxTouchPointsなどでの判定だけだと、「タッチ機能付きディスプレイを使っているがマウスでしか操作しない」場合にも
		// タッチで使っていると判定されてしまうため、実際に一度でもタッチされたらtrueにする
		isTouchUsing = true;

		isScreenTouching = true;
	}, { passive: true });
	
	window.addEventListener('touchend', () => {
		isScreenTouching = false;
	}, { passive: true });
}
