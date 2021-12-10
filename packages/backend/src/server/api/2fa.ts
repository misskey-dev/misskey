import * as crypto from 'crypto';
import config from '@/config/index';
import * as jsrsasign from 'jsrsasign';

const ECC_PRELUDE = Buffer.from([0x04]);
const NULL_BYTE = Buffer.from([0]);
const PEM_PRELUDE = Buffer.from(
	'3059301306072a8648ce3d020106082a8648ce3d030107034200',
	'hex',
);

// Android Safetynet attestations are signed with this cert:
const GSR2 = `-----BEGIN CERTIFICATE-----
MIIDujCCAqKgAwIBAgILBAAAAAABD4Ym5g0wDQYJKoZIhvcNAQEFBQAwTDEgMB4G
A1UECxMXR2xvYmFsU2lnbiBSb290IENBIC0gUjIxEzARBgNVBAoTCkdsb2JhbFNp
Z24xEzARBgNVBAMTCkdsb2JhbFNpZ24wHhcNMDYxMjE1MDgwMDAwWhcNMjExMjE1
MDgwMDAwWjBMMSAwHgYDVQQLExdHbG9iYWxTaWduIFJvb3QgQ0EgLSBSMjETMBEG
A1UEChMKR2xvYmFsU2lnbjETMBEGA1UEAxMKR2xvYmFsU2lnbjCCASIwDQYJKoZI
hvcNAQEBBQADggEPADCCAQoCggEBAKbPJA6+Lm8omUVCxKs+IVSbC9N/hHD6ErPL
v4dfxn+G07IwXNb9rfF73OX4YJYJkhD10FPe+3t+c4isUoh7SqbKSaZeqKeMWhG8
eoLrvozps6yWJQeXSpkqBy+0Hne/ig+1AnwblrjFuTosvNYSuetZfeLQBoZfXklq
tTleiDTsvHgMCJiEbKjNS7SgfQx5TfC4LcshytVsW33hoCmEofnTlEnLJGKRILzd
C9XZzPnqJworc5HGnRusyMvo4KD0L5CLTfuwNhv2GXqF4G3yYROIXJ/gkwpRl4pa
zq+r1feqCapgvdzZX99yqWATXgAByUr6P6TqBwMhAo6CygPCm48CAwEAAaOBnDCB
mTAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUm+IH
V2ccHsBqBt5ZtJot39wZhi4wNgYDVR0fBC8wLTAroCmgJ4YlaHR0cDovL2NybC5n
bG9iYWxzaWduLm5ldC9yb290LXIyLmNybDAfBgNVHSMEGDAWgBSb4gdXZxwewGoG
3lm0mi3f3BmGLjANBgkqhkiG9w0BAQUFAAOCAQEAmYFThxxol4aR7OBKuEQLq4Gs
J0/WwbgcQ3izDJr86iw8bmEbTUsp9Z8FHSbBuOmDAGJFtqkIk7mpM0sYmsL4h4hO
291xNBrBVNpGP+DTKqttVCL1OmLNIG+6KYnX3ZHu01yiPqFbQfXf5WRDLenVOavS
ot+3i9DAgBkcRcAtjOj4LaR0VknFBbVPFd5uRHg5h6h+u/N5GJG79G+dwfCMNYxd
AfvDbbnvRG15RjF+Cv6pgsH/76tuIMRQyV+dTZsXjAzlAcmgQWpzU/qlULRuJQ/7
TBj0/VLZjmmx6BEP3ojY+x1J96relc8geMJgEtslQIxq/H5COEBkEveegeGTLg==
-----END CERTIFICATE-----\n`;

function base64URLDecode(source: string) {
	return Buffer.from(source.replace(/\-/g, '+').replace(/_/g, '/'), 'base64');
}

function getCertSubject(certificate: string) {
	const subjectCert = new jsrsasign.X509();
	subjectCert.readCertPEM(certificate);

	const subjectString = subjectCert.getSubjectString();
	const subjectFields = subjectString.slice(1).split('/');

	const fields = {} as Record<string, string>;
	for (const field of subjectFields) {
		const eqIndex = field.indexOf('=');
		fields[field.substring(0, eqIndex)] = field.substring(eqIndex + 1);
	}

	return fields;
}

function verifyCertificateChain(certificates: string[]) {
	let valid = true;

	for (let i = 0; i < certificates.length; i++) {
		const Cert = certificates[i];
		const certificate = new jsrsasign.X509();
		certificate.readCertPEM(Cert);

		const CACert = i + 1 >= certificates.length ? Cert : certificates[i + 1];

		const certStruct = jsrsasign.ASN1HEX.getTLVbyList(certificate.hex!, 0, [0]);
		const algorithm = certificate.getSignatureAlgorithmField();
		const signatureHex = certificate.getSignatureValueHex();

		// Verify against CA
		const Signature = new jsrsasign.KJUR.crypto.Signature({ alg: algorithm });
		Signature.init(CACert);
		Signature.updateHex(certStruct);
		valid = valid && !!Signature.verify(signatureHex); // true if CA signed the certificate
	}

	return valid;
}

function PEMString(pemBuffer: Buffer, type = 'CERTIFICATE') {
	if (pemBuffer.length === 65 && pemBuffer[0] === 0x04) {
		pemBuffer = Buffer.concat([PEM_PRELUDE, pemBuffer], 91);
		type = 'PUBLIC KEY';
	}
	const cert = pemBuffer.toString('base64');

	const keyParts = [];
	const max = Math.ceil(cert.length / 64);
	let start = 0;
	for (let i = 0; i < max; i++) {
		keyParts.push(cert.substring(start, start + 64));
		start += 64;
	}

	return (
		`-----BEGIN ${type}-----\n` +
		keyParts.join('\n') +
		`\n-----END ${type}-----\n`
	);
}

export function hash(data: Buffer) {
	return crypto
		.createHash('sha256')
		.update(data)
		.digest();
}

export function verifyLogin({
	publicKey,
	authenticatorData,
	clientDataJSON,
	clientData,
	signature,
	challenge,
}: {
	publicKey: Buffer,
	authenticatorData: Buffer,
	clientDataJSON: Buffer,
	clientData: any,
	signature: Buffer,
	challenge: string
}) {
	if (clientData.type != 'webauthn.get') {
		throw new Error('type is not webauthn.get');
	}

	if (hash(clientData.challenge).toString('hex') != challenge) {
		throw new Error('challenge mismatch');
	}
	if (clientData.origin != config.scheme + '://' + config.host) {
		throw new Error('origin mismatch');
	}

	const verificationData = Buffer.concat(
		[authenticatorData, hash(clientDataJSON)],
		32 + authenticatorData.length,
	);

	return crypto
		.createVerify('SHA256')
		.update(verificationData)
		.verify(PEMString(publicKey), signature);
}

export const procedures = {
	none: {
		verify({ publicKey }: {publicKey: Map<number, Buffer>}) {
			const negTwo = publicKey.get(-2);

			if (!negTwo || negTwo.length != 32) {
				throw new Error('invalid or no -2 key given');
			}
			const negThree = publicKey.get(-3);
			if (!negThree || negThree.length != 32) {
				throw new Error('invalid or no -3 key given');
			}

			const publicKeyU2F = Buffer.concat(
				[ECC_PRELUDE, negTwo, negThree],
				1 + 32 + 32,
			);

			return {
				publicKey: publicKeyU2F,
				valid: true,
			};
		},
	},
	'android-key': {
		verify({
			attStmt,
			authenticatorData,
			clientDataHash,
			publicKey,
			rpIdHash,
			credentialId,
		}: {
			attStmt: any,
			authenticatorData: Buffer,
			clientDataHash: Buffer,
			publicKey: Map<number, any>;
			rpIdHash: Buffer,
			credentialId: Buffer,
		}) {
			if (attStmt.alg != -7) {
				throw new Error('alg mismatch');
			}

			const verificationData = Buffer.concat([
				authenticatorData,
				clientDataHash,
			]);

			const attCert: Buffer = attStmt.x5c[0];

			const negTwo = publicKey.get(-2);

			if (!negTwo || negTwo.length != 32) {
				throw new Error('invalid or no -2 key given');
			}
			const negThree = publicKey.get(-3);
			if (!negThree || negThree.length != 32) {
				throw new Error('invalid or no -3 key given');
			}

			const publicKeyData = Buffer.concat(
				[ECC_PRELUDE, negTwo, negThree],
				1 + 32 + 32,
			);

			if (!attCert.equals(publicKeyData)) {
				throw new Error('public key mismatch');
			}

			const isValid = crypto
				.createVerify('SHA256')
				.update(verificationData)
				.verify(PEMString(attCert), attStmt.sig);

			// TODO: Check 'attestationChallenge' field in extension of cert matches hash(clientDataJSON)

			return {
				valid: isValid,
				publicKey: publicKeyData,
			};
		},
	},
	// what a stupid attestation
	'android-safetynet': {
		verify({
			attStmt,
			authenticatorData,
			clientDataHash,
			publicKey,
			rpIdHash,
			credentialId,
		}: {
			attStmt: any,
			authenticatorData: Buffer,
			clientDataHash: Buffer,
			publicKey: Map<number, any>;
			rpIdHash: Buffer,
			credentialId: Buffer,
		}) {
			const verificationData = hash(
				Buffer.concat([authenticatorData, clientDataHash]),
			);

			const jwsParts = attStmt.response.toString('utf-8').split('.');

			const header = JSON.parse(base64URLDecode(jwsParts[0]).toString('utf-8'));
			const response = JSON.parse(
				base64URLDecode(jwsParts[1]).toString('utf-8'),
			);
			const signature = jwsParts[2];

			if (!verificationData.equals(Buffer.from(response.nonce, 'base64'))) {
				throw new Error('invalid nonce');
			}

			const certificateChain = header.x5c
				.map((key: any) => PEMString(key))
				.concat([GSR2]);

			if (getCertSubject(certificateChain[0]).CN != 'attest.android.com') {
				throw new Error('invalid common name');
			}

			if (!verifyCertificateChain(certificateChain)) {
				throw new Error('Invalid certificate chain!');
			}

			const signatureBase = Buffer.from(
				jwsParts[0] + '.' + jwsParts[1],
				'utf-8',
			);

			const valid = crypto
				.createVerify('sha256')
				.update(signatureBase)
				.verify(certificateChain[0], base64URLDecode(signature));

			const negTwo = publicKey.get(-2);

			if (!negTwo || negTwo.length != 32) {
				throw new Error('invalid or no -2 key given');
			}
			const negThree = publicKey.get(-3);
			if (!negThree || negThree.length != 32) {
				throw new Error('invalid or no -3 key given');
			}

			const publicKeyData = Buffer.concat(
				[ECC_PRELUDE, negTwo, negThree],
				1 + 32 + 32,
			);
			return {
				valid,
				publicKey: publicKeyData,
			};
		},
	},
	packed: {
		verify({
			attStmt,
			authenticatorData,
			clientDataHash,
			publicKey,
			rpIdHash,
			credentialId,
		}: {
			attStmt: any,
			authenticatorData: Buffer,
			clientDataHash: Buffer,
			publicKey: Map<number, any>;
			rpIdHash: Buffer,
			credentialId: Buffer,
		}) {
			const verificationData = Buffer.concat([
				authenticatorData,
				clientDataHash,
			]);

			if (attStmt.x5c) {
				const attCert = attStmt.x5c[0];

				const validSignature = crypto
					.createVerify('SHA256')
					.update(verificationData)
					.verify(PEMString(attCert), attStmt.sig);

				const negTwo = publicKey.get(-2);

				if (!negTwo || negTwo.length != 32) {
					throw new Error('invalid or no -2 key given');
				}
				const negThree = publicKey.get(-3);
				if (!negThree || negThree.length != 32) {
					throw new Error('invalid or no -3 key given');
				}

				const publicKeyData = Buffer.concat(
					[ECC_PRELUDE, negTwo, negThree],
					1 + 32 + 32,
				);

				return {
					valid: validSignature,
					publicKey: publicKeyData,
				};
			} else if (attStmt.ecdaaKeyId) {
				// https://fidoalliance.org/specs/fido-v2.0-id-20180227/fido-ecdaa-algorithm-v2.0-id-20180227.html#ecdaa-verify-operation
				throw new Error('ECDAA-Verify is not supported');
			} else {
				if (attStmt.alg != -7) throw new Error('alg mismatch');

				throw new Error('self attestation is not supported');
			}
		},
	},

	'fido-u2f': {
		verify({
			attStmt,
			authenticatorData,
			clientDataHash,
			publicKey,
			rpIdHash,
			credentialId,
		}: {
			attStmt: any,
			authenticatorData: Buffer,
			clientDataHash: Buffer,
			publicKey: Map<number, any>,
			rpIdHash: Buffer,
			credentialId: Buffer
		}) {
			const x5c: Buffer[] = attStmt.x5c;
			if (x5c.length != 1) {
				throw new Error('x5c length does not match expectation');
			}

			const attCert = x5c[0];

			// TODO: make sure attCert is an Elliptic Curve (EC) public key over the P-256 curve

			const negTwo: Buffer = publicKey.get(-2);

			if (!negTwo || negTwo.length != 32) {
				throw new Error('invalid or no -2 key given');
			}
			const negThree: Buffer = publicKey.get(-3);
			if (!negThree || negThree.length != 32) {
				throw new Error('invalid or no -3 key given');
			}

			const publicKeyU2F = Buffer.concat(
				[ECC_PRELUDE, negTwo, negThree],
				1 + 32 + 32,
			);

			const verificationData = Buffer.concat([
				NULL_BYTE,
				rpIdHash,
				clientDataHash,
				credentialId,
				publicKeyU2F,
			]);

			const validSignature = crypto
				.createVerify('SHA256')
				.update(verificationData)
				.verify(PEMString(attCert), attStmt.sig);

			return {
				valid: validSignature,
				publicKey: publicKeyU2F,
			};
		},
	},
};
