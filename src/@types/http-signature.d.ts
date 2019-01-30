declare module 'http-signature' {
	import { IncomingMessage, ClientRequest } from 'http';

	interface Signature {
		keyId: string,
		algorithm: string,
		headers: string[],
		signature: string
	}

	interface ParseRequestOptions {
		clockSkew?: number,
		headers?: string[],
		algorithms?: string[],
		strict?: boolean,
		authorizationHeaderName?: string
	}

	interface ParsedSignature  {
		scheme: string,
		params: Signature,
		signingString: string
	}

	type RequestSignerConstructorOptions =
		RequestSignerConstructorOptionsFromProperties |
		RequestSignerConstructorOptionsFromFunction;

	interface RequestSignerConstructorOptionsFromProperties {
		keyId: string,
		key: string | Buffer
		algorithm?: string
	}

	interface RequestSignerConstructorOptionsFromFunction {
		sign?: (data: string, cb: (err: any, sig: Signature) => void) => void
	}

	class RequestSigner {
		constructor(options: RequestSignerConstructorOptions);

		writeHeader(
			header: string,
			value: string): string;

		writeDateHeader(): string;

		writeTarget(method: string,path: string): void;

		sign(cb: (err: any, authz: string) => void): void;
	}

	interface SignRequestOptions {
		keyId: string,
		key: string,
		headers?: string[],
		algorithm?: string,
		httpVersion?: string,
		strict?: boolean
	}

	export function parse(request: IncomingMessage, options?: ParseRequestOptions): ParsedSignature;
	export function parseRequest(request: IncomingMessage, options?: ParseRequestOptions): ParsedSignature;

	export function sign(request: ClientRequest, options: SignRequestOptions): boolean;
	export function signRequest(request: ClientRequest, options: SignRequestOptions): boolean;
	export function createSigner(): RequestSigner;
	export function isSigner(obj: any): obj is RequestSigner;

	export function sshKeyToPEM(key: string): string;
	export function sshKeyFingerprint(key: string): string;
	export function pemToRsaSSHKey(pem: string, comment: string): string;

	export function verify(parsedSignature: ParsedSignature, pubkey: string | Buffer): boolean;
	export function verifySignature(parsedSignature: ParsedSignature, pubkey: string | Buffer): boolean;
	export function verifyHMAC(parsedSignature: ParsedSignature, secret: string): boolean;
}
