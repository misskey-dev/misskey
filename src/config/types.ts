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
	db: {
		host: string;
		port: number;
		db: string;
		user: string;
		pass: string;
		disableCache?: boolean;
		extra?: { [x: string]: string };
	};
	redis: {
		host: string;
		port: number;
		pass: string;
		db?: number;
		prefix?: string;
	};
	elasticsearch: {
		host: string;
		port: number;
		pass: string;
		index?: string;
	};

	autoAdmin?: boolean;

	proxy?: string;
	proxySmtp?: string;

	accesslog?: string;

	clusterLimit?: number;

	id: string;

	outgoingAddressFamily?: 'ipv4' | 'ipv6' | 'dual';

	deliverJobConcurrency?: number;
	inboxJobConcurrency?: number;

	syslog: {
		host: string;
		port: number;
	};
};

/**
 * Misskeyが自動的に(ユーザーが設定した情報から推論して)設定する情報
 */
export type Mixin = {
	version: string;
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
