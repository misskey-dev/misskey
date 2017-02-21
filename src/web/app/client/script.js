(() => {
	const head = document.getElementsByTagName('head')[0];
	const ua = navigator.userAgent.toLowerCase();
	const isMobile = /mobile|iphone|ipad|android/.test(ua);

	isMobile ? mountMobile() : mountDesktop();

	function mountDesktop() {
		const script = document.createElement('script');
		script.setAttribute('src', '/_/resources/desktop/script.js');
		script.setAttribute('async', 'true');
		script.setAttribute('defer', 'true');
		head.appendChild(script);
	}

	function mountMobile() {
		const meta = document.createElement('meta');
		meta.setAttribute('name', 'viewport');
		meta.setAttribute('content', 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no');
		head.appendChild(meta);

		const script = document.createElement('script');
		script.setAttribute('src', '/_/resources/mobile/script.js');
		script.setAttribute('async', 'true');
		script.setAttribute('defer', 'true');
		head.appendChild(script);
	}
})();
