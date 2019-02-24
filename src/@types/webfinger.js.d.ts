declare module 'webfinger.js' {
	interface IWebFingerConstructorConfig {
		tls_only?: boolean;
		webfist_fallback?: boolean;
		uri_fallback?: boolean;
		request_timeout?: number;
	}

	type JRDProperties = { [type: string]: string };

	interface IJRDLink {
		rel: string;
		type?: string;
		href?: string;
		template?: string;
		titles?: { [lang: string]: string };
		properties?: JRDProperties;
	}

	interface IJRD {
		subject?: string;
		expires?: Date;
		aliases?: string[];
		properties?: JRDProperties;
		links?: IJRDLink[];
	}

	interface IIDXLinks {
		'avatar': IJRDLink[];
		'remotestorage': IJRDLink[];
		'blog': IJRDLink[];
		'vcard': IJRDLink[];
		'updates': IJRDLink[];
		'share': IJRDLink[];
		'profile': IJRDLink[];
		'webfist': IJRDLink[];
		'camlistore': IJRDLink[];
		[type: string]: IJRDLink[];
	}

	interface IIDXProperties {
		'name': string;
		[type: string]: string;
	}

	interface IIDX {
		links: IIDXLinks;
		properties: IIDXProperties;
	}

	interface ILookupCallbackResult {
		object: IJRD;
		json: string;
		idx: IIDX;
	}

	type LookupCallback = (err: Error | string, result?: ILookupCallbackResult) => void;

	export class WebFinger {
		constructor(config?: IWebFingerConstructorConfig);

		public lookup(address: string, cb: LookupCallback): NodeJS.Timeout;
		public lookupLink(address: string, rel: string, cb: IJRDLink): void;
	}
}
