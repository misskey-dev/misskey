// Attention: Partial Type Definition

declare module 'jsrsasign' {
	//// HELPER TYPES

	/**
	 * Attention: The value might be changed by the function.
	 */
	type Mutable<T> = T;

	/**
	 * Deprecated: The function might be deleted in future release.
	 */
	type Deprecated<T> = T;

	//// COMMON TYPES

	/**
	 * byte number
	 */
	type ByteNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 | 112 | 113 | 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121 | 122 | 123 | 124 | 125 | 126 | 127 | 128 | 129 | 130 | 131 | 132 | 133 | 134 | 135 | 136 | 137 | 138 | 139 | 140 | 141 | 142 | 143 | 144 | 145 | 146 | 147 | 148 | 149 | 150 | 151 | 152 | 153 | 154 | 155 | 156 | 157 | 158 | 159 | 160 | 161 | 162 | 163 | 164 | 165 | 166 | 167 | 168 | 169 | 170 | 171 | 172 | 173 | 174 | 175 | 176 | 177 | 178 | 179 | 180 | 181 | 182 | 183 | 184 | 185 | 186 | 187 | 188 | 189 | 190 | 191 | 192 | 193 | 194 | 195 | 196 | 197 | 198 | 199 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 209 | 210 | 211 | 212 | 213 | 214 | 215 | 216 | 217 | 218 | 219 | 220 | 221 | 222 | 223 | 224 | 225 | 226 | 227 | 228 | 229 | 230 | 231 | 232 | 233 | 234 | 235 | 236 | 237 | 238 | 239 | 240 | 241 | 242 | 243 | 244 | 245 | 246 | 247 | 248 | 249 | 250 | 251 | 252 | 253 | 254 | 255;

	/**
	 * hexadecimal string /[0-9A-F]/
	 */
	type HexString = string;

	/**
	 * binary string /[01]/
	 */
	type BinString = string;

	/**
	 * base64 string /[A-Za-z0-9+/]=+/
	 */
	type Base64String = string;

	/**
	 * base64 URL encoded string /[A-Za-z0-9_-]/
	 */
	type Base64URLString = string;

	/**
	 * time value (ex. "151231235959Z")
	 */
	type TimeValue = string;

	/**
	 * OID string (ex. '1.2.3.4.567')
	 */
	type OID = string;

	/**
	 * OID name
	 */
	type OIDName = string;

	/**
	 * PEM formatted string
	 */
	type PEM = string;

	//// ASN1 TYPES

	class ASN1Object {
		public isModified: boolean;

		public hTLV: ASN1TLV;

		public hT: ASN1T;

		public hL: ASN1L;

		public hV: ASN1V;

		public getLengthHexFromValue(): HexString;

		public getEncodedHex(): ASN1TLV;

		public getValueHex(): ASN1V;

		public getFreshValueHex(): ASN1V;
	}

	class DERAbstractStructured extends ASN1Object {
		constructor(params?: Partial<Record<'array', ASN1Object[]>>);

		public setByASN1ObjectArray(asn1ObjectArray: ASN1Object[]): void;

		public appendASN1Object(asn1Object: ASN1Object): void;
	}

	class DERSequence extends DERAbstractStructured {
		constructor(params?: Partial<Record<'array', ASN1Object[]>>);

		public getFreshValueHex(): ASN1V;
	}

	//// ASN1HEX TYPES

	/**
	 * ASN.1 DER encoded data (hexadecimal string)
	 */
	type ASN1S = HexString;

	/**
	 * index of something
	 */
	type Idx<T extends { [idx: string]: unknown } | { [idx: number]: unknown }> = ASN1S extends { [idx: string]: unknown } ? string : ASN1S extends { [idx: number]: unknown } ? number : never;

	/**
	 * byte length of something
	 */
	type ByteLength<T extends { length: unknown }> = T['length'];

	/**
	 * ASN.1 L(length) (hexadecimal string)
	 */
	type ASN1L = HexString;

	/**
	 * ASN.1 T(tag) (hexadecimal string)
	 */
	type ASN1T = HexString;

	/**
	 * ASN.1 V(value) (hexadecimal string)
	 */
	type ASN1V = HexString;

	/**
	 * ASN.1 TLV (hexadecimal string)
	 */
	type ASN1TLV = HexString;

	/**
	 * ASN.1 object string
	 */
	type ASN1ObjectString = string;

	/**
	 * nth
	 */
	type Nth = number;

	/**
	 * ASN.1 DER encoded OID value (hexadecimal string)
	 */
	type ASN1OIDV = HexString;

	class ASN1HEX {
		public static getLblen(s: ASN1S, idx: Idx<ASN1S>): ByteLength<ASN1L>;

		public static getL(s: ASN1S, idx: Idx<ASN1S>): ASN1L;

		public static getVblen(s: ASN1S, idx: Idx<ASN1S>): ByteLength<ASN1V>;

		public static getVidx(s: ASN1S, idx: Idx<ASN1S>): Idx<ASN1V>;

		public static getV(s: ASN1S, idx: Idx<ASN1S>): ASN1V;

		public static getTLV(s: ASN1S, idx: Idx<ASN1S>): ASN1TLV;

		public static getNextSiblingIdx(s: ASN1S, idx: Idx<ASN1S>): Idx<ASN1ObjectString>;

		public static getChildIdx(h: ASN1S, pos: Idx<ASN1S>): Idx<ASN1ObjectString>[];

		public static getNthChildIdx(h: ASN1S, idx: Idx<ASN1S>, nth: Nth): Idx<ASN1ObjectString>;

		public static getIdxbyList(h: ASN1S, currentIndex: Idx<ASN1ObjectString>, nthList: Mutable<Nth[]>, checkingTag?: string): Idx<Mutable<Nth[]>>;

		public static getTLVbyList(h: ASN1S, currentIndex: Idx<ASN1ObjectString>, nthList: Mutable<Nth[]>, checkingTag?: string): ASN1TLV;

		// tslint:disable-next-line:bool-param-default
		public static getVbyList(h: ASN1S, currentIndex: Idx<ASN1ObjectString>, nthList: Mutable<Nth[]>, checkingTag?: string, removeUnusedbits?: boolean): ASN1V;

		public static hextooidstr(hex: ASN1OIDV): OID;

		public static dump(hexOrObj: ASN1S | ASN1Object, flags?: Record<string, unknown>, idx?: Idx<ASN1S>, indent?: string): string;

		public static isASN1HEX(hex: string): hex is HexString;

		public static oidname(oidDotOrHex: OID | ASN1OIDV): OIDName;
	}

	//// BIG INTEGER TYPES (PARTIAL)

	class BigInteger {
		constructor(a: null);

		constructor(a: number, b: SecureRandom);

		constructor(a: number, b: number, c: SecureRandom);

		constructor(a: unknown);

		constructor(a: string, b: number);

		public am(i: number, x: number, w: number, j: number, c: number, n: number): number;

		public DB: number;

		public DM: number;

		public DV: number;

		public FV: number;

		public F1: number;

		public F2: number;

		protected copyTo(r: Mutable<BigInteger>): void;

		protected fromInt(x: number): void;

		protected fromString(s: string, b: number): void;

		protected clamp(): void;

		public toString(b: number): string;

		public negate(): BigInteger;

		public abs(): BigInteger;

		public compareTo(a: BigInteger): number;

		public bitLength(): number;

		protected dlShiftTo(n: number, r: Mutable<BigInteger>): void;

		protected drShiftTo(n: number, r: Mutable<BigInteger>): void;

		protected lShiftTo(n: number, r: Mutable<BigInteger>): void;

		protected rShiftTo(n: number, r: Mutable<BigInteger>): void;

		protected subTo(a: BigInteger, r: Mutable<BigInteger>): void;

		protected multiplyTo(a: BigInteger, r: Mutable<BigInteger>): void;

		protected squareTo(r: Mutable<BigInteger>): void;

		protected divRemTo(m: BigInteger, q: Mutable<BigInteger>, r: Mutable<BigInteger>): void;

		public mod(a: BigInteger): BigInteger;

		protected invDigit(): number;

		protected isEven(): boolean;

		protected exp(e: number, z: Classic | Montgomery): BigInteger;

		public modPowInt(e: number, m: BigInteger): BigInteger;

		public static ZERO: BigInteger;

		public static ONE: BigInteger;
	}

	class Classic {
		constructor(m: BigInteger);

		public convert(x: BigInteger): BigInteger;

		public revert(x: BigInteger): BigInteger;

		public reduce(x: Mutable<BigInteger>): void;

		public mulTo(x: BigInteger, r: Mutable<BigInteger>): void;

		public sqrTo(x: BigInteger, y: BigInteger, r: Mutable<BigInteger>): void;
	}

	class Montgomery {
		constructor(m: BigInteger);

		public convert(x: BigInteger): BigInteger;

		public revert(x: BigInteger): BigInteger;

		public reduce(x: Mutable<BigInteger>): void;

		public mulTo(x: BigInteger, r: Mutable<BigInteger>): void;

		public sqrTo(x: BigInteger, y: BigInteger, r: Mutable<BigInteger>): void;
	}

	//// KEYUTIL TYPES

	type DecryptAES = (dataHex: HexString, keyHex: HexString, ivHex: HexString) => HexString;

	type Decrypt3DES = (dataHex: HexString, keyHex: HexString, ivHex: HexString) => HexString;

	type DecryptDES = (dataHex: HexString, keyHex: HexString, ivHex: HexString) => HexString;

	type EncryptAES = (dataHex: HexString, keyHex: HexString, ivHex: HexString) => HexString;

	type Encrypt3DES = (dataHex: HexString, keyHex: HexString, ivHex: HexString) => HexString;

	type EncryptDES = (dataHex: HexString, keyHex: HexString, ivHex: HexString) => HexString;

	type AlgList = {
		'AES-256-CBC':  { 'proc': DecryptAES;  'eproc': EncryptAES;  keylen: 32; ivlen: 16; };
		'AES-192-CBC':  { 'proc': DecryptAES;  'eproc': EncryptAES;  keylen: 24; ivlen: 16; };
		'AES-128-CBC':  { 'proc': DecryptAES;  'eproc': EncryptAES;  keylen: 16; ivlen: 16; };
		'DES-EDE3-CBC': { 'proc': Decrypt3DES; 'eproc': Encrypt3DES; keylen: 24; ivlen: 8;  };
		'DES-CBC':      { 'proc': DecryptDES;  'eproc': EncryptDES;  keylen: 8;  ivlen: 8;  };
	};

	type AlgName = keyof AlgList;

	type PEMHeadAlgName = 'RSA' | 'EC' | 'DSA';

	type GetKeyRSAParam = RSAKey | {
		n: BigInteger;
		e: number;
	} | Record<'n' | 'e', HexString> | Record<'n' | 'e', HexString> & Record<'d' | 'p' | 'q' | 'dp' | 'dq' | 'co', HexString | null> | {
		n: BigInteger;
		e: number;
		d: BigInteger;
	} | {
		kty: 'RSA';
	} & Record<'n' | 'e', Base64URLString> | {
		kty: 'RSA';
	} & Record<'n' | 'e' | 'd' | 'p' | 'q' | 'dp' | 'dq' | 'qi', Base64URLString> | {
		kty: 'RSA';
	} & Record<'n' | 'e' | 'd', Base64URLString>;

	type GetKeyECDSAParam = KJUR.crypto.ECDSA | {
		curve: KJUR.crypto.CurveName;
		xy: HexString;
	} | {
		curve: KJUR.crypto.CurveName;
		d: HexString;
	} | {
		kty: 'EC';
		crv: KJUR.crypto.CurveName;
		x: Base64URLString;
		y: Base64URLString;
	} | {
		kty: 'EC';
		crv: KJUR.crypto.CurveName;
		x: Base64URLString;
		y: Base64URLString;
		d: Base64URLString;
	};

	type GetKeyDSAParam = KJUR.crypto.DSA | Record<'p' | 'q' | 'g', BigInteger> & Record<'y', BigInteger | null> | Record<'p' | 'q' | 'g' | 'x', BigInteger> & Record<'y', BigInteger | null>;

	type GetKeyParam = GetKeyRSAParam | GetKeyECDSAParam | GetKeyDSAParam | string;

	class KEYUTIL {
		public version: '1.0.0';

		public parsePKCS5PEM(sPKCS5PEM: PEM): Partial<Record<'type' | 's', string>> & (Record<'cipher' | 'ivsalt', string> | Record<'cipher' | 'ivsalt', undefined>);

		public getKeyAndUnusedIvByPasscodeAndIvsalt(algName: AlgName, passcode: string, ivsaltHex: HexString): Record<'keyhex' | 'ivhex', HexString>;

		public decryptKeyB64(privateKeyB64: Base64String, sharedKeyAlgName: AlgName, sharedKeyHex: HexString, ivsaltHex: HexString): Base64String;

		public getDecryptedKeyHex(sEncryptedPEM: PEM, passcode: string): HexString;

		public getEncryptedPKCS5PEMFromPrvKeyHex(pemHeadAlg: PEMHeadAlgName, hPrvKey: string, passcode: string, sharedKeyAlgName?: AlgName | null, ivsaltHex?: HexString | null): PEM;

		public parseHexOfEncryptedPKCS8(sHEX: HexString): {
			ciphertext: ASN1V;
			encryptionSchemeAlg: 'TripleDES';
			encryptionSchemeIV: ASN1V;
			pbkdf2Salt: ASN1V;
			pbkdf2Iter: number;
		};

		public getPBKDF2KeyHexFromParam(info: ReturnType<this['parseHexOfEncryptedPKCS8']>, passcode: string): HexString;

		private _getPlainPKCS8HexFromEncryptedPKCS8PEM(pkcs8PEM: PEM, passcode: string): HexString;

		public getKeyFromEncryptedPKCS8PEM(prvKeyHex: HexString): ReturnType<this['getKeyFromPlainPrivatePKCS8Hex']>;

		public parsePlainPrivatePKCS8Hex(pkcs8PrvHex: HexString): {
			algparam: ASN1V | null;
			algoid: ASN1V;
			keyidx: Idx<ASN1V>;
		};

		public getKeyFromPlainPrivatePKCS8PEM(prvKeyHex: HexString): ReturnType<this['getKeyFromPlainPrivatePKCS8Hex']>;

		public getKeyFromPlainPrivatePKCS8Hex(prvKeyHex: HexString): RSAKey | KJUR.crypto.DSA | KJUR.crypto.ECDSA;

		private _getKeyFromPublicPKCS8Hex(h: HexString): RSAKey | KJUR.crypto.DSA | KJUR.crypto.ECDSA;

		public parsePublicRawRSAKeyHex(pubRawRSAHex: HexString): Record<'n' | 'e', ASN1V>;

		public parsePublicPKCS8Hex(pkcs8PubHex: HexString): {
			algparam: ASN1V | Record<'p' | 'q' | 'g', ASN1V> | null;
			algoid: ASN1V;
			key: ASN1V;
		};

		public static getKey(param: GetKeyRSAParam): RSAKey;

		public static getKey(param: GetKeyECDSAParam): KJUR.crypto.ECDSA;

		public static getKey(param: GetKeyDSAParam): KJUR.crypto.DSA;

		public static getKey(param: string, passcode?: string, hextype?: string): RSAKey | KJUR.crypto.ECDSA | KJUR.crypto.DSA;

		public static generateKeypair(alg: 'RSA', keylen: number): Record<'prvKeyObj' | 'pubKeyObj', RSAKey>;

		public static generateKeypair(alg: 'EC', curve: KJUR.crypto.CurveName): Record<'prvKeyObj' | 'pubKeyObj', KJUR.crypto.ECDSA>;

		public static getPEM(keyObjOrHex: RSAKey | KJUR.crypto.ECDSA | KJUR.crypto.DSA, formatType?: 'PKCS1PRV' | 'PKCS5PRV' | 'PKCS8PRV', passwd?: string, encAlg?: 'DES-CBC' | 'DES-EDE3-CBC' | 'AES-128-CBC' | 'AES-192-CBC' | 'AES-256-CBC', hexType?: string, ivsaltHex?: HexString): object; // To Do

		public static getKeyFromCSRPEM(csrPEM: PEM): RSAKey | KJUR.crypto.ECDSA | KJUR.crypto.DSA;

		public static getKeyFromCSRHex(csrHex: HexString): RSAKey | KJUR.crypto.ECDSA | KJUR.crypto.DSA;

		public static parseCSRHex(csrHex: HexString): Record<'p8pubkeyhex', ASN1TLV>;

		public static getJWKFromKey(keyObj: RSAKey): {
			kty: 'RSA';
		} & Record<'n' | 'e' | 'd' | 'p' | 'q' | 'dp' | 'dq' | 'qi', Base64URLString> | {
			kty: 'RSA';
		} & Record<'n' | 'e', Base64URLString>;

		public static getJWKFromKey(keyObj: KJUR.crypto.ECDSA): {
			kty: 'EC';
			crv: KJUR.crypto.CurveName;
			x: Base64URLString;
			y: Base64URLString;
			d: Base64URLString;
		} | {
			kty: 'EC';
			crv: KJUR.crypto.CurveName;
			x: Base64URLString;
			y: Base64URLString;
		};
	}

	//// KJUR NAMESPACE (PARTIAL)

	namespace KJUR {
		namespace crypto {
			type CurveName = 'secp128r1' | 'secp160k1' | 'secp160r1' | 'secp192k1' | 'secp192r1' | 'secp224r1' | 'secp256k1' | 'secp256r1' | 'secp384r1' | 'secp521r1';

			class DSA {
				public p: BigInteger | null;

				public q: BigInteger | null;

				public g: BigInteger | null;

				public y: BigInteger | null;

				public x: BigInteger | null;

				public type: 'DSA';

				public isPrivate: boolean;

				public isPublic: boolean;

				public setPrivate(p: BigInteger, q: BigInteger, g: BigInteger, y: BigInteger | null, x: BigInteger): void;

				public setPrivateHex(hP: HexString, hQ: HexString, hG: HexString, hY: HexString | null, hX: HexString): void;

				public setPublic(p: BigInteger, q: BigInteger, g: BigInteger, y: BigInteger): void;

				public setPublicHex(hP: HexString, hQ: HexString, hG: HexString, hY: HexString): void;

				public signWithMessageHash(sHashHex: HexString): HexString;

				public verifyWithMessageHash(sHashHex: HexString, hSigVal: HexString): boolean;

				public parseASN1Signature(hSigVal: HexString): [BigInteger, BigInteger];

				public readPKCS5PrvKeyHex(h: HexString): void;

				public readPKCS8PrvKeyHex(h: HexString): void;

				public readPKCS8PubKeyHex(h: HexString): void;

				public readCertPubKeyHex(h: HexString, nthPKI: number): void;
			}

			class ECDSA {
				constructor(params?: {
					curve?: CurveName;
					prv?: HexString;
					pub?: HexString;
				});

				public p: BigInteger | null;

				public q: BigInteger | null;

				public g: BigInteger | null;

				public y: BigInteger | null;

				public x: BigInteger | null;

				public type: 'EC';

				public isPrivate: boolean;

				public isPublic: boolean;

				public getBigRandom(limit: BigInteger): BigInteger;

				public setNamedCurve(curveName: CurveName): void;

				public setPrivateKeyHex(prvKeyHex: HexString): void;

				public setPublicKeyHex(pubKeyHex: HexString): void;

				public getPublicKeyXYHex(): Record<'x' | 'y', HexString>;

				public getShortNISTPCurveName(): 'P-256' | 'P-384' | null;

				public generateKeyPairHex(): Record<'ecprvhex' | 'ecpubhex', HexString>;

				public signWithMessageHash(hashHex: HexString): HexString;

				public signHex(hashHex: HexString, privHex: HexString): HexString;

				public verifyWithMessageHash(sHashHex: HexString, hSigVal: HexString): boolean;

				public parseASN1Signature(hSigVal: HexString): [BigInteger, BigInteger];

				public readPKCS5PrvKeyHex(h: HexString): void;

				public readPKCS8PrvKeyHex(h: HexString): void;

				public readPKCS8PubKeyHex(h: HexString): void;

				public readCertPubKeyHex(h: HexString, nthPKI: number): void;

				public static parseSigHex(sigHex: HexString): Record<'r' | 's', BigInteger>;

				public static parseSigHexInHexRS(sigHex: HexString): Record<'r' | 's', ASN1V>;

				public static asn1SigToConcatSig(asn1Sig: HexString): HexString;

				public static concatSigToASN1Sig(concatSig: HexString): ASN1TLV;

				public static hexRSSigToASN1Sig(hR: HexString, hS: HexString): ASN1TLV;

				public static biRSSigToASN1Sig(biR: BigInteger, biS: BigInteger): ASN1TLV;

				public static getName(s: CurveName | HexString): 'secp256r1' | 'secp256k1' | 'secp384r1' | null;
			}

			class Signature {
				constructor(params?: ({
					alg: string;
					prov?: string;
				} | {}) & ({
					psssaltlen: number;
				} | {}) & ({
					prvkeypem: PEM;
					prvkeypas?: never;
				} | {}));

				private _setAlgNames(): void;

				private _zeroPaddingOfSignature(hex: HexString, bitLength: number): HexString;

				public setAlgAndProvider(alg: string, prov: string): void;

				public init(key: GetKeyParam, pass?: string): void;

				public updateString(str: string): void;

				public updateHex(hex: HexString): void;

				public sign(): HexString;

				public signString(str: string): HexString;

				public signHex(hex: HexString): HexString;

				public verify(hSigVal: string): boolean | 0;
			}
		}
	}

	//// RSAKEY TYPES

	class RSAKey {
		public n: BigInteger | null;

		public e: number;

		public d: BigInteger | null;

		public p: BigInteger | null;

		public q: BigInteger | null;

		public dmp1: BigInteger | null;

		public dmq1: BigInteger | null;

		public coeff: BigInteger | null;

		public type: 'RSA';

		public isPrivate?: boolean;

		public isPublic?: boolean;

		//// RSA PUBLIC

		protected doPublic(x: BigInteger): BigInteger;

		public setPublic(N: BigInteger, E: number): void;

		public setPublic(N: HexString, E: HexString): void;

		public encrypt(text: string): HexString | null;

		public encryptOAEP(text: string, hash?: string | ((s: string) => string), hashLen?: number): HexString | null;

		//// RSA PRIVATE

		protected doPrivate(x: BigInteger): BigInteger;

		public setPrivate(N: BigInteger, E: number, D: BigInteger): void;

		public setPrivate(N: HexString, E: HexString, D: HexString): void;

		public setPrivateEx(N: HexString, E: HexString, D?: HexString | null, P?: HexString | null, Q?: HexString | null, DP?: HexString | null, DQ?: HexString | null, C?: HexString | null): void;

		public generate(B: number, E: HexString): void;

		public decrypt(ctext: HexString): string;

		public decryptOAEP(ctext: HexString, hash?: string | ((s: string) => string), hashLen?: number): string | null;

		//// RSA PEM

		public getPosArrayOfChildrenFromHex(hPrivateKey: PEM): Idx<ASN1ObjectString>[];

		public getHexValueArrayOfChildrenFromHex(hPrivateKey: PEM): Idx<ASN1ObjectString>[];

		public readPrivateKeyFromPEMString(keyPEM: PEM): void;

		public readPKCS5PrvKeyHex(h: HexString): void;

		public readPKCS8PrvKeyHex(h: HexString): void;

		public readPKCS5PubKeyHex(h: HexString): void;

		public readPKCS8PubKeyHex(h: HexString): void;

		public readCertPubKeyHex(h: HexString, nthPKI: Nth): void;

		//// RSA SIGN

		public sign(s: string, hashAlg: string): HexString;

		public signWithMessageHash(sHashHex: HexString, hashAlg: string): HexString;

		public signPSS(s: string, hashAlg: string, sLen: number): HexString;

		public signWithMessageHashPSS(hHash: HexString, hashAlg: string, sLen: number): HexString;

		public verify(sMsg: string, hSig: HexString): boolean | 0;

		public verifyWithMessageHash(sHashHex: HexString, hSig: HexString): boolean | 0;

		public verifyPSS(sMsg: string, hSig: HexString, hashAlg: string, sLen: number): boolean;

		public verifyWithMessageHashPSS(hHash: HexString, hSig: HexString, hashAlg: string, sLen: number): boolean;

		public static SALT_LEN_HLEN: -1;

		public static SALT_LEN_MAX: -2;

		public static SALT_LEN_RECOVER: -2;
	}

	/// RNG TYPES
	class SecureRandom {
		public nextBytes(ba: Mutable<ByteNumber[]>): void;
	}

	//// X509 TYPES

	type ExtInfo = {
		critical: boolean;
		oid: OID;
		vidx: Idx<ASN1V>;
	};

	type ExtAIAInfo = Record<'ocsp' | 'caissuer', string>;

	type ExtCertificatePolicy = {
		id: OIDName;
	} & Partial<{
		cps: string;
	} | {
		unotice: string;
	}>;

	class X509 {
		public hex: HexString | null;

		public version: number;

		public foffset: number;

		public aExtInfo: null;

		public getVersion(): number;

		public getSerialNumberHex(): ASN1V;

		public getSignatureAlgorithmField(): OIDName;

		public getIssuerHex(): ASN1TLV;

		public getIssuerString(): HexString;

		public getSubjectHex(): ASN1TLV;

		public getSubjectString(): HexString;

		public getNotBefore(): TimeValue;

		public getNotAfter(): TimeValue;

		public getPublicKeyHex(): ASN1TLV;

		public getPublicKeyIdx(): Idx<Mutable<Nth[]>>;

		public getPublicKeyContentIdx(): Idx<Mutable<Nth[]>>;

		public getPublicKey(): RSAKey | KJUR.crypto.ECDSA | KJUR.crypto.DSA;

		public getSignatureAlgorithmName(): OIDName;

		public getSignatureValueHex(): ASN1V;

		public verifySignature(pubKey: GetKeyParam): boolean | 0;

		public parseExt(): void;

		public getExtInfo(oidOrName: OID | string): ExtInfo | undefined;

		public getExtBasicConstraints(): ExtInfo | {} | {
			cA: true;
			pathLen?: number;
		};

		public getExtKeyUsageBin(): BinString;

		public getExtKeyUsageString(): string;

		public getExtSubjectKeyIdentifier(): ASN1V | undefined;

		public getExtAuthorityKeyIdentifier(): {
			kid: ASN1V;
		} | undefined;

		public getExtExtKeyUsageName(): OIDName[] | undefined;

		public getExtSubjectAltName(): Deprecated<string[]>;

		public getExtSubjectAltName2(): ['MAIL' | 'DNS' | 'DN' | 'URI' | 'IP', string][] | undefined;

		public getExtCRLDistributionPointsURI(): string[] | undefined;

		public getExtAIAInfo(): ExtAIAInfo | undefined;

		public getExtCertificatePolicies(): ExtCertificatePolicy[] | undefined;

		public readCertPEM(sCertPEM: PEM): void;

		public readCertHex(sCertHex: HexString): void;

		public getInfo(): string;

		public static hex2dn(hex: HexString, idx?: Idx<HexString>): string;

		public static hex2rdn(hex: HexString, idx?: Idx<HexString>): string;

		public static hex2attrTypeValue(hex: HexString, idx?: Idx<HexString>): string;

		public static getPublicKeyFromCertPEM(sCertPEM: PEM): RSAKey | KJUR.crypto.ECDSA | KJUR.crypto.DSA;

		public static getPublicKeyInfoPropOfCertPEM(sCertPEM: PEM): {
			algparam: ASN1V | null;
			leyhex: ASN1V;
			algoid: ASN1V;
		};
	}
}
