declare module 'hcaptcha' {
	export function verify(secret: string, token: string): Promise<{
		success: boolean;
		challenge_ts: string;
		hostname: string;
		credit?: boolean;
		'error-codes'?: unknown[];
	}>;
}
