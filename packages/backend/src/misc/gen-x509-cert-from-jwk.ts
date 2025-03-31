import forge from 'node-forge';
import * as jose from 'jose';

export async function genX509CertFromJWK(
	hostname: string,
	notBefore: Date,
	notAfter: Date,
	publicKey: string,
	privateKey: string,
	alg: string,
): Promise<string> {
	const cert = forge.pki.createCertificate();
	cert.serialNumber = '01';
	cert.validity.notBefore = notBefore;
	cert.validity.notAfter = notAfter;

	const attrs = [{ name: 'commonName', value: hostname }];
	cert.setSubject(attrs);
	cert.setIssuer(attrs);
	cert.publicKey = await jose
		.importJWK(JSON.parse(publicKey), alg, { extractable: true })
		.then((k) => jose.exportSPKI(k as jose.CryptoKey))
		.then((k) => forge.pki.publicKeyFromPem(k));

	cert.sign(
		await jose
			.importJWK(JSON.parse(privateKey), alg, { extractable: true })
			.then((k) => jose.exportPKCS8(k as jose.CryptoKey))
			.then((k) => forge.pki.privateKeyFromPem(k)),
		forge.md.sha256.create(),
	);

	return forge.pki.certificateToPem(cert);
}
