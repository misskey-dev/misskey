declare module 'recaptcha-promise' {
	interface IVerifyOptions {
		secret_key?: string;
	}

	interface IVerify {
		(response: string, remoteAddress?: string): Promise<boolean>;
		init(options: IVerifyOptions): IVerify;
	}

	namespace recaptchaPromise {} // Hack

	const verify: IVerify;

	export = verify;
}
