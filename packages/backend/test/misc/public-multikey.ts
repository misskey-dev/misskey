/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { KeyObject } from 'node:crypto';
import type { IActor } from '@/core/activitypub/type.js';

export const actorId = 'https://remote.example/users/alice';
export const host = (uri: string) => new URL(uri).host;

export function base58btc(bytes: Uint8Array): string {
	const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	let value = BigInt('0x' + Buffer.from(bytes).toString('hex'));
	let result = '';
	while (value > 0n) {
		result = alphabet[Number(value % 58n)] + result;
		value /= 58n;
	}
	for (const byte of bytes) {
		if (byte !== 0) break;
		result = '1' + result;
	}
	return 'z' + result;
}

export function multikey(publicKey: KeyObject, id = actorId + '#key') {
	const rsa = publicKey.asymmetricKeyType === 'rsa';
	const der = publicKey.export({ format: 'der', type: rsa ? 'pkcs1' : 'spki' });
	return {
		id, type: 'Multikey' as const, controller: actorId,
		publicKeyMultibase: base58btc(Buffer.concat([Buffer.from(rsa ? [0x85, 0x24] : [0xed, 0x01]), rsa ? der : der.subarray(-32)])),
	};
}

export function actor(extra: Partial<IActor> = {}): IActor {
	return { type: 'Person', id: actorId, inbox: actorId + '/inbox', preferredUsername: 'alice', ...extra } as IActor;
}
