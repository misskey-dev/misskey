/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPublicKey } from 'node:crypto';
import { decodePublicMultikey } from '@misskey-dev/node-http-message-signatures';
import { In, Not, type EntityManager } from 'typeorm';
import { MiUser } from '@/models/User.js';
import { MiUserPublickey } from '@/models/UserPublickey.js';
import type { IActor } from '../type.js';

export type ActorPublicKeys = {
	keys: { keyId: string; keyPem: string }[];
	/** Only a fully understood key collection authorizes removal of omitted keys. */
	replace: boolean;
	rejectedKeyIds: string[];
};

/** Embedded assertionMethod only: no key URI dereferencing or proof verification. */
export function extractActorPublicKeys(actor: IActor, punyHost: (uri: string) => string): ActorPublicKeys | undefined {
	if (typeof actor.id !== 'string') throw new Error('invalid Actor: missing id');
	if (actor.publicKey == null && actor.assertionMethod == null) return undefined;
	const legacy = actor.publicKey == null ? [] : [
		...(actor.additionalPublicKeys ?? []),
		...(Array.isArray(actor.publicKey) ? actor.publicKey : [actor.publicKey]),
	];
	const assertions: unknown[] = Array.isArray(actor.assertionMethod) ? actor.assertionMethod : [];
	if (legacy.length > 32 || assertions.length > 16) throw new Error('invalid Actor: too many public keys');
	const keys = new Map<string, string>();
	const rejected = new Set<string>();
	let replace = actor.assertionMethod == null || Array.isArray(actor.assertionMethod);
	const host = punyHost(actor.id);
	for (const [entries, multikey] of [[legacy, false], [assertions, true]] as const) {
		for (const entry of entries) {
			try {
				if (entry == null || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('unresolved key');
				const key = entry as Record<string, unknown>;
				if (typeof key.id !== 'string' || key.id.length === 0 || key.id.length > 256) throw new Error('invalid key ID');
				const uri = new URL(key.id);
				if (!['http:', 'https:'].includes(uri.protocol) || uri.username || uri.password || punyHost(key.id) !== host) throw new Error('invalid key URI');
				let keyPem: string;
				if (multikey) {
					if (key.type !== 'Multikey' || key.controller !== actor.id || key.secretKeyMultibase != null || key.revoked != null || key.expires != null) throw new Error('unsupported Multikey');
					if (typeof key.publicKeyMultibase !== 'string' || key.publicKeyMultibase.length > 8192) throw new Error('invalid Multikey material');
					keyPem = createPublicKey({ key: Buffer.from(decodePublicMultikey(key.publicKeyMultibase)), format: 'der', type: 'spki' }).export({ type: 'spki', format: 'pem' }).toString();
				} else {
					if (key.owner != null && key.owner !== actor.id) throw new Error('invalid key owner');
					if (typeof key.publicKeyPem !== 'string' || key.publicKeyPem.length > 4096 || key.publicKeyPem.includes('PRIVATE KEY')) throw new Error('invalid PEM material');
					keyPem = createPublicKey(key.publicKeyPem).export({ type: 'spki', format: 'pem' }).toString();
				}
				if (keyPem.length > 4096) throw new Error('public key exceeds storage limit');
				if (rejected.has(key.id)) continue;
				const previous = keys.get(key.id);
				if (previous != null && previous !== keyPem) {
					keys.delete(key.id);
					rejected.add(key.id);
					replace = false;
				} else {
					keys.set(key.id, keyPem);
				}
			} catch {
				// An unsupported/malformed entry is not evidence that old keys were revoked.
				replace = false;
			}
		}
	}
	return { keys: Array.from(keys, ([keyId, keyPem]) => ({ keyId, keyPem })), replace, rejectedKeyIds: Array.from(rejected) };
}

/** Caller owns the transaction; serialize refreshes and never transfer key ownership. */
export async function storeActorPublicKeys(manager: EntityManager, userId: string, collection: ActorPublicKeys): Promise<void> {
	await manager.findOneOrFail(MiUser, { where: { id: userId }, lock: { mode: 'pessimistic_write' } });
	for (const key of [...collection.keys].sort((a, b) => a.keyId.localeCompare(b.keyId))) {
		await manager.query(`INSERT INTO "user_publickey" ("keyId", "userId", "keyPem") VALUES ($1, $2, $3)
			ON CONFLICT ("keyId") DO UPDATE SET "keyPem" = EXCLUDED."keyPem"
			WHERE "user_publickey"."userId" = EXCLUDED."userId"`, [key.keyId, userId, key.keyPem]);
	}
	if (collection.replace) {
		await manager.delete(MiUserPublickey, collection.keys.length === 0
			? { userId } : { userId, keyId: Not(In(collection.keys.map(key => key.keyId))) });
	} else if (collection.rejectedKeyIds.length > 0) {
		await manager.delete(MiUserPublickey, { userId, keyId: In(collection.rejectedKeyIds) });
	}
}
