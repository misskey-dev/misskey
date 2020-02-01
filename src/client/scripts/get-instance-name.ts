export function getInstanceName() {
	const siteName = document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement;
	if (siteName && siteName.content) {
		return siteName.content;
	}

	return 'Misskey';
}
