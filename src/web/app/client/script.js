/**
 * MISSKEY CLIENT ENTRY POINT
 */
(() => {
	const head = document.getElementsByTagName('head')[0];

	// Detect user language
	let lang = (navigator.languages && navigator.languages[0]) || navigator.language;
	if (!/en|en\-US|ja/.test(lang)) lang = 'en';

	// Detect user agent
	const ua = navigator.userAgent.toLowerCase();
	const isMobile = /mobile|iphone|ipad|android/.test(ua);

	isMobile ? mountMobile() : mountDesktop();

	/**
	 * Mount the desktop app
	 */
	function mountDesktop() {
		const script = document.createElement('script');
		script.setAttribute('src', `/assets/desktop/script.${VERSION}.${lang}.js`);
		script.setAttribute('async', 'true');
		script.setAttribute('defer', 'true');
		head.appendChild(script);
	}

	/**
	 * Mount the mobile app
	 */
	function mountMobile() {
		const meta = document.createElement('meta');
		meta.setAttribute('name', 'viewport');
		meta.setAttribute('content', 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no');
		head.appendChild(meta);

		const script = document.createElement('script');
		script.setAttribute('src', `/assets/mobile/script.${VERSION}.${lang}.js`);
		script.setAttribute('async', 'true');
		script.setAttribute('defer', 'true');
		head.appendChild(script);
	}
})();
