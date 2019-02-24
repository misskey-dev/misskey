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

	accesslog?: string;

	clusterLimit?: number;
};

/**
 * Misskeyが自動的に(ユーザーが設定した情報から推論して)設定する情報
 */
export type Mixin = {
	host: string;
	hostname: string;
	scheme: string;
	wsScheme: string;
	apiUrl: string;
	wsUrl: string;
	authUrl: string;
	driveUrl: string;
	userAgent: string;
};

export type Config = Source & Mixin;
