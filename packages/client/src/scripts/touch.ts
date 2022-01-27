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
		// 子要素のtouchstartイベントでstopPropagation()が呼ばれると親要素に伝搬されずタッチされたと判定されないため、
		// touchendイベントでもtouchstartイベントと同様にtrueにする
		isTouchUsing = true;

		isScreenTouching = false;
	}, { passive: true });
}
