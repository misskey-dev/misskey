import * as crypto from "crypto";
import config from "../../config";

const ECC_PRELUDE = Buffer.from([0x04]);
const NULL_BYTE = Buffer.from([0]);
const PEM_PRELUDE = Buffer.from(
	"3059301306072a8648ce3d020106082a8648ce3d030107034200",
	"hex"
);

function PEMString(pemBuffer: Buffer, type = "CERTIFICATE") {
	if (pemBuffer.length == 65 && pemBuffer[0] == 0x04) {
		pemBuffer = Buffer.concat([PEM_PRELUDE, pemBuffer], 91);
		type = "PUBLIC KEY";
	}
	const cert = pemBuffer.toString("base64");

	const keyParts = [];
	const max = Math.ceil(cert.length / 64);
	let start = 0;
	for (let i = 0; i < max; i++) {
		keyParts.push(cert.substring(start, start + 64));
		start += 64;
	}

	return (
		`-----BEGIN ${type}-----\n` +
		keyParts.join("\n") +
		`\n-----END ${type}-----\n`
	);
}

export function hash(data: Buffer) {
	return crypto
		.createHash("sha256")
		.update(data)
		.digest();
}

export function verifyLogin({
	publicKey,
	authenticatorData,
	clientDataJSON,
	clientData,
	signature,
	challenge
}: {
	publicKey: Buffer,
	authenticatorData: Buffer,
	clientDataJSON: Buffer,
	clientData: any,
	signature: Buffer,
	challenge: String
}) {
	if (clientData.type != "webauthn.get") {
		throw new Error("type is not webauthn.get");
	}

	if (hash(clientData.challenge).toString("hex") != challenge) {
		throw new Error("challenge mismatch");
	}
	if (clientData.origin != config.scheme + "://" + config.host) {
		throw new Error("origin mismatch");
	}

	const verificationData = Buffer.concat(
		[authenticatorData, hash(clientDataJSON)],
		32 + authenticatorData.length
	);

	return crypto
		.createVerify("SHA256")
		.update(verificationData)
		.verify(PEMString(publicKey), signature);
}

export const procedures = {
	packed: {
		verify({
			attStmt,
			authenticatorData,
			clientDataHash,
			publicKey,
			rpIdHash,
			credentialId
		}: {
			attStmt: any,
			authenticatorData: Buffer,
			clientDataHash: Buffer,
			publicKey: Map<Number, any>,
			rpIdHash: Buffer,
			credentialId: Buffer
		}) {
			const verificationData = Buffer.concat([
				authenticatorData,
				clientDataHash
			]);

			if (attStmt.x5c) {
				const attCert = attStmt.x5c[0];

				const validSignature = crypto
					.createVerify("SHA256")
					.update(verificationData)
					.verify(PEMString(attCert), attStmt.sig);

				const negTwo = publicKey.get(-2);

				if (!negTwo || negTwo.length != 32) {
					throw new Error("invalid or no -2 key given");
				}
				const negThree = publicKey.get(-3);
				if (!negThree || negThree.length != 32) {
					throw new Error("invalid or no -3 key given");
				}

				const publicKeyData = Buffer.concat(
					[ECC_PRELUDE, negTwo, negThree],
					1 + 32 + 32
				);

				return {
					valid: validSignature,
					publicKey: publicKeyData
				};
			} else if (attStmt.ecdaaKeyId) {
				// https://fidoalliance.org/specs/fido-v2.0-id-20180227/fido-ecdaa-algorithm-v2.0-id-20180227.html#ecdaa-verify-operation
				throw new Error("ECDAA-Verify is not supported");
			} else {
				if (attStmt.alg != -7) throw new Error("alg mismatch");

				throw new Error("self attestation is not supported");
			}
		}
	},

	"fido-u2f": {
		verify({
			attStmt,
			authenticatorData,
			clientDataHash,
			publicKey,
			rpIdHash,
			credentialId
		}: {
			attStmt: any,
			authenticatorData: Buffer,
			clientDataHash: Buffer,
			publicKey: Map<Number, any>,
			rpIdHash: Buffer,
			credentialId: Buffer
		}) {
			const x5c: Array<Buffer> = attStmt.x5c;
			if (x5c.length != 1) {
				throw new Error("x5c length does not match expectation");
			}

			const attCert = x5c[0];

			// TODO: make sure attCert is an Elliptic Curve (EC) public key over the P-256 curve

			const negTwo: Buffer = publicKey.get(-2);

			if (!negTwo || negTwo.length != 32) {
				throw new Error("invalid or no -2 key given");
			}
			const negThree: Buffer = publicKey.get(-3);
			if (!negThree || negThree.length != 32) {
				throw new Error("invalid or no -3 key given");
			}

			const publicKeyU2F = Buffer.concat(
				[ECC_PRELUDE, negTwo, negThree],
				1 + 32 + 32
			);

			const verificationData = Buffer.concat([
				NULL_BYTE,
				rpIdHash,
				clientDataHash,
				credentialId,
				publicKeyU2F
			]);

			const validSignature = crypto
				.createVerify("SHA256")
				.update(verificationData)
				.verify(PEMString(attCert), attStmt.sig);

			return {
				valid: validSignature,
				publicKey: publicKeyU2F
			};
		}
	}
};
