import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import define from '../../../define';
import { UserProfiles, UserSecurityKeys, AttestationChallenges } from '../../../../../models';
import { ensure } from '../../../../../prelude/ensure';
import config from '../../../../../config';
import { promisify } from 'util';
import * as cbor from 'cbor';
import { procedures, hash } from '../../../2fa';

const cborDecodeFirst = promisify(cbor.decodeFirst);

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		clientDataJSON: {
			validator: $.str
		},
		attestationObject: {
			validator: $.str
		},
              	password: {
                        validator: $.str
	        },
	        challengeId: {
                        validator: $.str
		},
	        name: {
                        validator: $.str
		}
	}
};

const rpIdHashReal = hash(Buffer.from(config.hostname, 'utf-8'));

export default define(meta, async (ps, user) => {
	const profile = await UserProfiles.findOne(user.id).then(ensure);

	// Compare password
	const same = await bcrypt.compare(ps.password, profile.password!);

	if (!same) {
		throw new Error('incorrect password');
	}

	if (!profile.twoFactorEnabled) {
		throw new Error('2fa not enabled');
	}

	const clientData = JSON.parse(ps.clientDataJSON);

	if (clientData.type != 'webauthn.create') {
		throw new Error('not a creation attestation');
	}
	if (clientData.origin != (config.scheme + '://' + config.host)) {
		throw new Error('origin mismatch');
	}  

	const clientDataJSONHash = hash(Buffer.from(ps.clientDataJSON, 'utf-8'));

	const attestation = await cborDecodeFirst(ps.attestationObject);

	const rpIdHash = attestation.authData.slice(0, 32);
	if (!rpIdHashReal.equals(rpIdHash)) {
		throw new Error('rpIdHash mismatch');
	}
        
	const flags = attestation.authData[32];
	if (flags & ~1) {
		throw new Error('user not present');
	}

	const authData = Buffer.from(attestation.authData);
	const credentialIdLength = authData.readUInt16BE(53);
	const credentialId = authData.slice(55, 55 + credentialIdLength);
	const publicKeyData = authData.slice(55 + credentialIdLength);
	const publicKey: Map<Number, any> = await cborDecodeFirst(publicKeyData);
	if (publicKey.get(3) != -7) {
		throw new Error('alg mismatch');
	}

	if (!procedures[attestation.fmt]) {
		throw new Error('unsupported fmt');
	}

        try {
		// tslint:disable-next-line:no-var-keyword
		var verificationData = procedures[attestation.fmt].verify({
    	         attStmt: attestation.attStmt,
	         authenticatorData: authData,
   	         clientDataHash: clientDataJSONHash,
  	         credentialId: credentialId.toString('hex'),
	         publicKey,
	         rpIdHash
	    });
	  if(!verificationData.valid) throw new Error("signature invalid");
        } catch(err) {
	    // rebind the error as part of the async context
            throw new Error(err.message);
	}

	const attestationChallenge = await AttestationChallenges.findOne({
		userId: user.id,
		challengeId: ps.challengeId,
		registrationChallenge: true,
		challenge: hash(clientData.challenge).toString('hex')
	});

	if (!attestationChallenge) {
		throw new Error('non-existent challenge');
	}

	await AttestationChallenges.delete({
		userId: user.id,
		challengeId: ps.challengeId
	});

	// Expired challenge (> 5min old)
	if (new Date().getTime() - attestationChallenge.createdAt.getTime() >= 5 * 60 * 1000) {
		throw new Error('expired challenge');
	}

	const credentialIdString = credentialId.toString('hex');

	await UserSecurityKeys.save({
		userId: user.id,
		credentialId: credentialIdString,
		lastUsed: new Date(),
		name: ps.name,
		publicKey: verificationData.publicKey.toString('hex')
	});

	return {
		credentialId: credentialIdString,
		name: ps.name
	};
});
