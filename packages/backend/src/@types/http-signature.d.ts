declare module '@peertube/http-signature' {
	import type { IncomingMessage, ClientRequest } from 'node:http';

	interface ISignature {
		keyId: string;
		algorithm: string;
		headers: string[];
		signature: string;
	}

	interface IOptions {
		headers?: string[];
		algorithm?: string;
		strict?: boolean;
		authorizationHeaderName?: string;
	}

	interface IParseRequestOptions extends IOptions {
		clockSkew?: number;
	}

	interface IParsedSignature {
		scheme: string;
		params: ISignature;
		signingString: string;
		algorithm: string;
		keyId: string;
	}

	type RequestSignerConstructorOptions =
		IRequestSignerConstructorOptionsFromProperties |
		IRequestSignerConstructorOptionsFromFunction;

	interface IRequestSignerConstructorOptionsFromProperties {
		keyId: string;
		key: string | Buffer;
		algorithm?: string;
	}

	interface IRequestSignerConstructorOptionsFromFunction {
		sign?: (data: string, cb: (err: any, sig: ISignature) => void) => void;
	}

	class RequestSigner {
		constructor(options: RequestSignerConstructorOptions);

		public writeHeader(header: string, value: string): string;

		public writeDateHeader(): string;

		public writeTarget(method: string, path: string): void;

		public sign(cb: (err: any, authz: string) => void): void;
	}

	interface ISignRequestOptions extends IOptions {
		keyId: string;
		key: string;
		httpVersion?: string;
	}

	export function parse(request: IncomingMessage, options?: IParseRequestOptions): IParsedSignature;
	export function parseRequest(request: IncomingMessage, options?: IParseRequestOptions): IParsedSignature;

	export function sign(request: ClientRequest, options: ISignRequestOptions): boolean;
	export function signRequest(request: ClientRequest, options: ISignRequestOptions): boolean;
	export function createSigner(): RequestSigner;
	export function isSigner(obj: any): obj is RequestSigner;

	export function sshKeyToPEM(key: string): string;
	export function sshKeyFingerprint(key: string): string;
	export function pemToRsaSSHKey(pem: string, comment: string): string;

	export function verify(parsedSignature: IParsedSignature, pubkey: string | Buffer): boolean;
	export function verifySignature(parsedSignature: IParsedSignature, pubkey: string | Buffer): boolean;
	export function verifyHMAC(parsedSignature: IParsedSignature, secret: string): boolean;
}
