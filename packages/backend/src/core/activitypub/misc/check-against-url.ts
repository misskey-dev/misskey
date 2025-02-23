/*
 * SPDX-FileCopyrightText: dakkar and sharkey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { IObject } from '../type.js';

export enum FetchAllowSoftFailMask {
	// Allow no softfail flags
	Strict = 0,
	// The values in tuple (requestUrl, finalUrl, objectId) are not all identical
	//
	// This condition is common for user-initiated lookups but should not be allowed in federation loop
	//
	// Allow variations:
	//   good example: https://alice.example.com/@user -> https://alice.example.com/user/:userId
	//   problematic example: https://alice.example.com/redirect?url=https://bad.example.com/ -> https://bad.example.com/ -> https://alice.example.com/somethingElse
	NonCanonicalId = 1 << 0,
	// Allow the final object to be at most one subdomain deeper than the request URL, similar to SPF relaxed alignment
	//
	// Currently no code path allows this flag to be set, but is kept in case of future use as some niche deployments do this, and we provide a pre-reviewed mechanism to opt-in.
	//
	// Allow variations:
	//   good example: https://example.com/@user -> https://activitypub.example.com/@user { id: 'https://activitypub.example.com/@user' }
	//   problematic example: https://example.com/@user -> https://untrusted.example.com/@user { id: 'https://untrusted.example.com/@user' }
	MisalignedOrigin = 1 << 1,
	// The requested URL has a different host than the returned object ID, although the final URL is still consistent with the object ID
	//
	// This condition is common for user-initiated lookups using an intermediate host but should not be allowed in federation loops
	//
	// Allow variations:
	//   good example: https://alice.example.com/@user@bob.example.com -> https://bob.example.com/@user { id: 'https://bob.example.com/@user' }
	//   problematic example: https://alice.example.com/definitelyAlice -> https://bob.example.com/@somebodyElse { id: 'https://bob.example.com/@somebodyElse' }
	CrossOrigin = 1 << 2 | MisalignedOrigin,
	// Allow all softfail flags
	//
	// do not use this flag on released code
	Any = ~0
}

/**
 * Fuzz match on whether the candidate host has authority over the request host
 * 
 * @param requestHost The host of the requested resources
 * @param candidateHost The host of final response
 * @returns Whether the candidate host has authority over the request host, or if a soft fail is required for a match
 */
function hostFuzzyMatch(requestHost: string, candidateHost: string): FetchAllowSoftFailMask {
	const requestFqdn = requestHost.endsWith('.') ? requestHost : `${requestHost}.`;
	const candidateFqdn = candidateHost.endsWith('.') ? candidateHost : `${candidateHost}.`;

	if (requestFqdn === candidateFqdn) {
		return FetchAllowSoftFailMask.Strict;
	}

	// allow only one case where candidateHost is a first-level subdomain of requestHost
	const requestDnsDepth = requestFqdn.split('.').length;
	const candidateDnsDepth = candidateFqdn.split('.').length;

	if ((candidateDnsDepth - requestDnsDepth) !== 1) {
		return FetchAllowSoftFailMask.CrossOrigin;
	}

	if (`.${candidateHost}`.endsWith(`.${requestHost}`)) {
		return FetchAllowSoftFailMask.MisalignedOrigin;
	}

	return FetchAllowSoftFailMask.CrossOrigin;
}

// normalize host names by removing www. prefix
function normalizeSynonymousSubdomain(url: URL | string): URL {
	const urlParsed = url instanceof URL ? url : new URL(url);
	const host = urlParsed.host;
	const normalizedHost = host.replace(/^www\./, '');
	return new URL(urlParsed.toString().replace(host, normalizedHost));
}

export function assertActivityMatchesUrls(requestUrl: string | URL, activity: IObject, candidateUrls: (string | URL)[], allowSoftfail: FetchAllowSoftFailMask): FetchAllowSoftFailMask {
	// must have a unique identifier to verify authority
	if (!activity.id) {
		throw new Error(`bad Activity: missing id field`);
	}

	let softfail = 0;

	// if the flag is allowed, set the flag on return otherwise throw
	const requireSoftfail = (needed: FetchAllowSoftFailMask, message: string) => {
		if ((allowSoftfail & needed) !== needed) {
			throw new Error(message);
		}

		softfail |= needed;
	}

	const requestUrlParsed = normalizeSynonymousSubdomain(requestUrl);
	const idParsed = normalizeSynonymousSubdomain(activity.id);
	
	const candidateUrlsParsed = candidateUrls.map(it => normalizeSynonymousSubdomain(it));

	const requestUrlSecure = requestUrlParsed.protocol === 'https:';
	const finalUrlSecure = candidateUrlsParsed.every(it => it.protocol === 'https:');
	if (requestUrlSecure && !finalUrlSecure) {
		throw new Error(`bad Activity: id(${activity?.id}) is not allowed to have http:// in the url`);
	}

	// Compare final URL to the ID
	if (!candidateUrlsParsed.some(it => it.href === idParsed.href)) {
		requireSoftfail(FetchAllowSoftFailMask.NonCanonicalId, `bad Activity: id(${activity?.id}) does not match response url(${candidateUrlsParsed.map(it => it.toString())})`);

		// at lease host need to match exactly (ActivityPub requirement) 
		if (!candidateUrlsParsed.some(it => idParsed.host === it.host)) {
			throw new Error(`bad Activity: id(${activity?.id}) does not match response host(${candidateUrlsParsed.map(it => it.host)})`);
		}
	}

	// Compare request URL to the ID
	if (!requestUrlParsed.href.includes(idParsed.href)) {
		requireSoftfail(FetchAllowSoftFailMask.NonCanonicalId, `bad Activity: id(${activity?.id}) does not match request url(${requestUrlParsed.toString()})`);

		// if cross-origin lookup is allowed, we can accept some variation between the original request URL to the final object ID (but not between the final URL and the object ID)
		const hostResult = hostFuzzyMatch(requestUrlParsed.host, idParsed.host);

		requireSoftfail(hostResult, `bad Activity: id(${activity?.id}) is valid but is not the same origin as request url(${requestUrlParsed.toString()})`);
	}
	
	return softfail;
}