declare module 'langmap' {
	type Lang = {
		nativeName: string;
		englishName: string;
	};

	const langmap: { [lang: string]: Lang };

	export = langmap;
}
