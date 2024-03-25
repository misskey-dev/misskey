import * as crypto from 'node:crypto';
import { genRSAAndEd25519KeyPair } from '@/misc/gen-key-pair.js';

describe(genRSAAndEd25519KeyPair, () => {
	test('generates key pair', async () => {
		const keyPair = await genRSAAndEd25519KeyPair();
		// 毎回違うキーペアが生成されることを確認するために2回生成して比較してみる
		const keyPair2 = await genRSAAndEd25519KeyPair();
		console.log(Object.entries(keyPair).map(([k, v]) => `${k}: ${v.length}`).join('\n'));
		console.log(Object.entries(keyPair).map(([k, v]) => `${k}\n${v}`).join('\n'));

		expect(keyPair.publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/);
		expect(keyPair.publicKey).toMatch(/-----END PUBLIC KEY-----\n$/);
		expect(keyPair.publicKey).not.toBe(keyPair2.publicKey);

		const publicKeyObj = crypto.createPublicKey(keyPair.publicKey);
		expect(publicKeyObj.asymmetricKeyType).toBe('rsa');

		expect(keyPair.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/);
		expect(keyPair.privateKey).toMatch(/-----END PRIVATE KEY-----\n$/);
		expect(keyPair.privateKey).not.toBe(keyPair2.privateKey);
		expect(keyPair.ed25519PublicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/);
		expect(keyPair.ed25519PublicKey).toMatch(/-----END PUBLIC KEY-----\n$/);
		expect(keyPair.ed25519PublicKey).not.toBe(keyPair2.ed25519PublicKey);

		const ed25519PublicKeyObj = crypto.createPublicKey(keyPair.ed25519PublicKey);
		expect(ed25519PublicKeyObj.asymmetricKeyType).toBe('ed25519');

		expect(keyPair.ed25519PrivateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/);
		expect(keyPair.ed25519PrivateKey).toMatch(/-----END PRIVATE KEY-----\n$/);
		expect(keyPair.ed25519PrivateKey).not.toBe(keyPair2.ed25519PrivateKey);
		//const imported = await webCrypto.subtle.importKey('spki', Buffer.from(keyPair.publicKey).buffer, { name: 'rsa-pss', hash: 'sha-256' }, false, ['verify']);
	});
});
