/**
 * ユーザーが設定する必要のある情報
 */
export type Source = {
	repository_url?: string;
	feedback_url?: string;
	url: string;
	port: number;
	https?: { [x: string]: string };
	disableHsts?: boolean;
	mongodb: {
		host: string;
		port: number;
		db: string;
		user: string;
		pass: string;
	};
	redis: {
		host: string;
		port: number;
		pass: string;
	};
	elasticsearch: {
		host: string;
		port: number;
		pass: string;
	};
	drive?: {
		storage: string;
		bucket?: string;
		prefix?: string;
		baseUrl?: string;
		config?: any;
	};

	autoAdmin?: boolean;

	proxy?: string;

	summalyProxy?: string;

	accesslog?: string;

	github_bot?: {
		hook_secret: string;
		username: string;
	};

	/**
	 * Service Worker
	 */
	sw?: {
		public_key: string;
		private_key: string;
	};

	clusterLimit?: number;

	user_recommendation?: {
		external: boolean;
		engine: string;
		timeout: number;
	};
};

/**
 * Misskeyが自動的に(ユーザーが設定した情報から推論して)設定する情報
 */
export type Mixin = {
	host: string;
	hostname: string;
	scheme: string;
	ws_scheme: string;
	api_url: string;
	ws_url: string;
	auth_url: string;
	docs_url: string;
	stats_url: string;
	status_url: string;
	dev_url: string;
	drive_url: string;
	user_agent: string;
};

export type Config = Source & Mixin;
