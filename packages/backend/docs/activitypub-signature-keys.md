# ActivityPub public keys and signature capabilities

Actor public keys use embedded `assertionMethod` entries with the standard
`Multikey` type, an exact Actor ID `controller`, and a base58btc
`publicKeyMultibase`. The context is `https://www.w3.org/ns/cid/v1`.
RSA uses the public `rsa-pub` codec with PKCS#1 DER; Ed25519 uses `ed25519-pub`
with 32 public bytes. Reference URI fetching, Data Integrity proofs, and
RFC 9421 support are separate features.

The standard legacy RSA `publicKey` / `publicKeyPem` remains available.
It and the RSA Multikey identify the same existing `#main-key`. Ed25519 uses
the existing `#ed25519-key`. Changing the public representation does not
generate new keys or require a new database migration. Old PKCS#1 private
keys continue to be converted to PKCS#8 by the loader introduced in #17872;
the conversion changes the container, not the RSA key material.

## Withdrawn experimental representation

`additionalPublicKeys` is deprecated and withdrawn from the unmerged proposal.
It is neither emitted in new Actors nor used for Actor key discovery.
The alias remains only in the historical preloaded JSON-LD security context
so already signed or queued documents retain their canonical bytes. That
normalization support does not advertise support for the old protocol.

Remote keys remain stored as SPKI PEM. A fully understood current key collection
replaces the old collection atomically. Omitting both `publicKey` and
`assertionMethod` leaves stored keys unchanged. An explicitly empty
`assertionMethod` retains only legacy keys present in that current document.
Malformed or unsupported entries do not authorize removal of omitted keys;
valid entries can still be added or updated. Conflicting material for the same
ID rejects that ID, including an existing row belonging to that Actor. A key
ID belonging to another Actor is never reassigned or overwritten.

## NodeInfo marker syntax

`httpMessageSignaturesImplementationLevel` keeps its two-character syntax.
The first character describes the signature family; the second describes key
discovery. `x1` and `x2` below mean either first character, not literal wire values.

| Marker | Meaning | Current outgoing key selection |
| --- | --- | --- |
| `00` | Draft, legacy RSA | RSA |
| `01` | Draft, deprecated x1 additionalPublicKeys proposal | RSA |
| `02` | Draft, x2 assertionMethod RSA/Ed25519 | Ed25519 if an existing key is available; otherwise RSA |
| `10`, `11`, `12` | Peer claims an RFC 9421 signature family | Conservative RSA; this code still emits draft signatures |
| Missing or unknown | No usable capability advertisement | RSA |

New nodes advertise `02` only at the stage that enables Ed25519 publication
and sending. The key-storage/publication foundation alone does not add that
advertisement. Stored x1 values are recognized as deprecated and are not
rewritten to x2. Metadata refetch changes the stored marker only from the
peer's actual newly retrieved advertisement. Markers are matched exactly,
never compared lexically. Explicit local key selection for internal use is
distinct from negotiating a remote peer capability.
