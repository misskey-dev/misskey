import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import * as jose from 'jose';
import * as Redis from 'ioredis';
import * as saml from 'samlify';
import * as validator from '@authenio/samlify-node-xmllint';
import fastifyView from '@fastify/view';
import fastifyCors from '@fastify/cors';
import fastifyFormbody from '@fastify/formbody';
import fastifyHttpErrorsEnhanced from 'fastify-http-errors-enhanced';
import pug from 'pug';
import xmlbuilder from 'xmlbuilder';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull, Not } from 'typeorm';
import Logger from '@/logger.js';
import type {
	MiSingleSignOnServiceProvider,
	SingleSignOnServiceProviderRepository,
	UserProfilesRepository,
	UsersRepository,
} from '@/models/_.js';
import { CacheService } from '@/core/CacheService.js';
import type { Config } from '@/config.js';
import { LoggerService } from '@/core/LoggerService.js';
import { RoleService } from '@/core/RoleService.js';
import type { MiLocalUser } from '@/models/User.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { FastifyInstance } from 'fastify';

@Injectable()
export class SAMLIdentifyProviderService {
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.singleSignOnServiceProviderRepository)
		private singleSignOnServiceProviderRepository: SingleSignOnServiceProviderRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private roleService: RoleService,
		private cacheService: CacheService,
		private loggerService: LoggerService,
	) {
		this.#logger = this.loggerService.getLogger('sso:saml');
		saml.setSchemaValidator(validator);
	}

	public async createIdPMetadataXml(
		provider: MiSingleSignOnServiceProvider,
	): Promise<string> {
		const today = new Date();
		const publicKey = await jose.importJWK(JSON.parse(provider.publicKey)).then((r) => jose.exportSPKI(r as jose.KeyLike));

		const nodes = {
			'md:EntityDescriptor': {
				'@xmlns:md': 'urn:oasis:names:tc:SAML:2.0:metadata',
				'@entityID': provider.issuer,
				'@validUntil': new Date(today.setFullYear(today.getFullYear() + 10)).toISOString(),
				'md:IDPSSODescriptor': {
					'@WantAuthnRequestsSigned': provider.wantAuthnRequestsSigned,
					'@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
					'md:KeyDescriptor': {
						'@use': 'signing',
						'ds:KeyInfo': {
							'@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
							'ds:X509Data': {
								'ds:X509Certificate': {
									'#text': publicKey,
								},
							},
						},
					},
					'md:NameIDFormat': {
						'#text': 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
					},
					'md:SingleSignOnService': [
						{
							'@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
							'@Location': `${this.config.url}/sso/saml/${provider.id}`,
						},
						{
							'@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
							'@Location': `${this.config.url}/sso/saml/${provider.id}`,
						},
					],
				},
			},
		};

		return xmlbuilder
			.create(nodes, { encoding: 'UTF-8', standalone: false })
			.end({ pretty: true });
	}

	public async createSPMetadataXml(
		provider: MiSingleSignOnServiceProvider,
	): Promise<string> {
		const today = new Date();
		const publicKey = await jose.importJWK(JSON.parse(provider.publicKey)).then((r) => jose.exportSPKI(r as jose.KeyLike));

		const keyDescriptor: unknown[] = [
			{
				'@use': 'signing',
				'ds:KeyInfo': {
					'@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
					'ds:X509Data': {
						'ds:X509Certificate': {
							'#text': publicKey,
						},
					},
				},
			},
		];

		if (provider.cipherAlgorithm) {
			keyDescriptor.push({
				'@use': 'encryption',
				'ds:KeyInfo': {
					'@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
					'ds:X509Data': {
						'ds:X509Certificate': {
							'#text': publicKey,
						},
					},
				},
				'md:EncryptionMethod': {
					'@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes256-cbc',
				},
			});
		}

		const nodes = {
			'md:EntityDescriptor': {
				'@xmlns:md': 'urn:oasis:names:tc:SAML:2.0:metadata',
				'@entityID': provider.issuer,
				'@validUntil': new Date(today.setFullYear(today.getFullYear() + 10)).toISOString(),
				'md:SPSSODescriptor': {
					'@AuthnRequestsSigned': provider.wantAuthnRequestsSigned,
					'@WantAssertionsSigned': provider.wantAssertionsSigned,
					'@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
					'md:KeyDescriptor': keyDescriptor,
					'md:NameIDFormat': {
						'#text': 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
					},
					'md:AssertionConsumerService': {
						'@index': 1,
						'@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
						'@Location': provider.acsUrl,
					},
				},
			},
		};

		return xmlbuilder
			.create(nodes, { encoding: 'UTF-8', standalone: false })
			.end({ pretty: true });
	}

	/**
	 * @desc Alternative to lodash.get
	 * @reference https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_get
	 * @param obj
	 * @param path
	 * @param defaultValue
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private get(obj: any, path: string, defaultValue: unknown) {
		return path
			.split('.')
			.reduce((a, c) => (a?.[c] ? a[c] : defaultValue || null), obj);
	}

	@bindThis
	public async createServer(fastify: FastifyInstance): Promise<void> {
		fastify.register(fastifyHttpErrorsEnhanced, { preHandler: (error: Error): Error => { this.#logger.error(error); return error; } });
		fastify.register(fastifyFormbody);
		fastify.register(fastifyCors);
		fastify.register(fastifyView, {
			root: fileURLToPath(new URL('../web/views', import.meta.url)),
			engine: { pug },
			defaultContext: {
				version: this.config.version,
				config: this.config,
			},
		});

		fastify.all<{
			Params: { serviceId: string };
			Querystring?: { SAMLRequest?: string; RelayState?: string };
			Body?: { SAMLRequest?: string; RelayState?: string };
		}>('/:serviceId', async (request, reply) => {
			const serviceId = request.params.serviceId;
			const binding = request.query?.SAMLRequest ? 'redirect' : 'post';
			const samlRequest = request.query?.SAMLRequest ?? request.body?.SAMLRequest;
			const relayState = request.query?.RelayState ?? request.body?.RelayState;

			const ssoServiceProvider = await this.singleSignOnServiceProviderRepository.findOneBy({ id: serviceId, type: 'saml', privateKey: Not(IsNull()) });
			if (!ssoServiceProvider) {
				reply.status(403).send({
					error: {
						message: 'Invalid SSO Service Provider id',
						code: 'INVALID_SSO_SP_ID',
						id: 'e2893d7e-df6f-44cf-8717-42234b8ac0ce',
						kind: 'client',
					},
				});
				return;
			}

			if (!samlRequest) {
				reply.status(400).send({
					error: {
						message: 'No SAMLRequest',
						code: 'NO_SAML_REQUEST',
						id: 'c58bc7e3-f92e-4879-a6a9-7258a13bc491',
						kind: 'client',
					},
				});
				return;
			}

			const idp = saml.IdentityProvider({
				metadata: await this.createIdPMetadataXml(ssoServiceProvider),
				privateKey: await jose
					.importJWK(JSON.parse(ssoServiceProvider.privateKey ?? '{}'))
					.then((r) => jose.exportPKCS8(r as jose.KeyLike)),
			});

			const sp = saml.ServiceProvider({
				metadata: await this.createSPMetadataXml(ssoServiceProvider),
			});

			const parsed = await idp.parseLoginRequest(sp, binding, { query: request.query, body: request.body });
			this.#logger.info('Parsed SAML request', { saml: parsed });

			const transactionId = randomUUID();
			await this.redisClient.set(
				`sso:saml:transaction:${transactionId}`,
				JSON.stringify({
					serviceId: serviceId,
					binding: binding,
					flowResult: parsed,
					relayState: relayState,
				}),
				'EX',
				60 * 5,
			);

			this.#logger.info(`Rendering authorization page for "${ssoServiceProvider.name ?? ssoServiceProvider.issuer}"`);

			reply.header('Cache-Control', 'no-store');
			return await reply.view('sso', {
				transactionId: transactionId,
				serviceName: ssoServiceProvider.name ?? ssoServiceProvider.issuer,
				kind: 'saml',
			});
		});

		fastify.get<{ Params: { serviceId: string } }>(
			'/:serviceId/metadata',
			async (request, reply) => {
				const serviceId = request.params.serviceId;
				const ssoServiceProvider = await this.singleSignOnServiceProviderRepository.findOneBy({ id: serviceId, type: 'saml' });
				if (!ssoServiceProvider) {
					reply.status(403).send({
						error: {
							message: 'Invalid SSO Service Provider id',
							code: 'INVALID_SSO_SP_ID',
							id: '8a6d72e1-3530-4ec0-9d4d-b105fdbb8a2d',
							kind: 'client',
						},
					});
					return;
				}

				reply.header('Content-Type', 'application/xml');
				reply.send(await this.createIdPMetadataXml(ssoServiceProvider));
			},
		);

		fastify.post<{
			Body: { transaction_id: string; login_token: string; cancel?: string };
		}>('/authorize', async (request, reply) => {
			const transactionId = request.body.transaction_id;
			const token = request.body.login_token;
			const cancel = !!request.body.cancel;

			if (cancel) {
				reply.redirect('/');
				return;
			}

			const transaction = await this.redisClient.get(`sso:saml:transaction:${transactionId}`);
			if (!transaction) {
				reply.status(403).send({
					error: {
						message: 'Invalid transaction id',
						code: 'INVALID_TRANSACTION_ID',
						id: 'cca6ea16-5f04-4d9e-9ef5-8a99bdef3a92',
						kind: 'client',
					},
				});
				return;
			}

			const { serviceId, binding, flowResult, relayState } = JSON.parse(transaction);

			const ssoServiceProvider =
				await this.singleSignOnServiceProviderRepository.findOneBy({ id: serviceId, type: 'saml' });
			if (!ssoServiceProvider) {
				reply.status(403).send({
					error: {
						message: 'Invalid SSO Service Provider id',
						code: 'INVALID_SSO_SP_ID',
						id: 'f644adfe-019a-478c-b5a9-897a2556f2b2',
						kind: 'client',
					},
				});
				return;
			}

			if (!token) {
				reply.status(401).send({
					error: {
						message: 'No login token',
						code: 'NO_LOGIN_TOKEN',
						id: 'cd96295e-0370-433d-a3de-421de4536b7f',
						kind: 'client',
					},
				});
				return;
			}

			const user = await this.cacheService.localUserByNativeTokenCache.fetch(
				token,
				() => this.usersRepository.findOneBy({ token }) as Promise<MiLocalUser | null>,
			);
			if (!user) {
				reply.status(403).send({
					error: {
						message: 'Invalid login token',
						code: 'INVALID_LOGIN_TOKEN',
						id: 'a002a4ed-0024-460f-8015-cc5e7c6cd0a7',
						kind: 'client',
					},
				});
				return;
			}

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
			const isAdministrator = await this.roleService.isAdministrator(user);
			const isModerator = await this.roleService.isModerator(user);
			const roles = await this.roleService.getUserRoles(user.id);

			try {
				const idp = saml.IdentityProvider({
					metadata: await this.createIdPMetadataXml(ssoServiceProvider),
					privateKey: await jose
						.importJWK(JSON.parse(ssoServiceProvider.privateKey ?? '{}'))
						.then((r) => jose.exportPKCS8(r as jose.KeyLike)),
					loginResponseTemplate: { context: 'ignored' },
				});

				const sp = saml.ServiceProvider({
					metadata: await this.createSPMetadataXml(ssoServiceProvider),
				});

				const samlResponse = await idp.createLoginResponse(
					sp,
					flowResult,
					binding,
					{},
					() => {
						const id = idp.entitySetting.generateID?.() ?? randomUUID();
						const assertionId = idp.entitySetting.generateID?.() ?? randomUUID();
						const nowTime = new Date();
						const fiveMinutesLaterTime = new Date(nowTime.getTime());
						fiveMinutesLaterTime.setMinutes(fiveMinutesLaterTime.getMinutes() + 5);
						const now = nowTime.toISOString();
						const fiveMinutesLater = fiveMinutesLaterTime.toISOString();

						const nodes = {
							'samlp:Response': {
								'@xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
								'@xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
								'@ID': id,
								'@Version': '2.0',
								'@IssueInstant': now,
								'@Destination': ssoServiceProvider.acsUrl,
								'@InResponseTo': this.get(flowResult, 'extract.request.id', ''),
								'saml:Issuer': {
									'#text': ssoServiceProvider.issuer,
								},
								'samlp:Status': {
									'samlp:StatusCode': {
										'@Value': 'urn:oasis:names:tc:SAML:2.0:status:Success',
									},
								},
								'saml:Assertion': {
									'@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
									'@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
									'@ID': assertionId,
									'@Version': '2.0',
									'@IssueInstant': now,
									'saml:Issuer': {
										'#text': ssoServiceProvider.issuer,
									},
									'saml:Subject': {
										'saml:NameID': {
											'@Format':
												'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
											'#text': user.id,
										},
										'saml:SubjectConfirmation': {
											'@Method': 'urn:oasis:names:tc:SAML:2.0:cm:bearer',
											'saml:SubjectConfirmationData': {
												'@InResponseTo': this.get(flowResult, 'extract.request.id', ''),
												'@NotOnOrAfter': fiveMinutesLater,
												'@Recipient': ssoServiceProvider.acsUrl,
											},
										},
									},
									'saml:Conditions': {
										'@NotBefore': now,
										'@NotOnOrAfter': fiveMinutesLater,
										'saml:AudienceRestriction': {
											'saml:Audience': [
												{ '#text': ssoServiceProvider.issuer },
												...ssoServiceProvider.audience.map((audience) => ({
													'#text': audience,
												})),
											],
										},
									},
									'saml:AuthnStatement': {
										'@AuthnInstant': now,
										'@SessionIndex': assertionId,
										'@SessionNotOnOrAfter': fiveMinutesLater,
										'saml:AuthnContext': {
											'saml:AuthnContextClassRef': {
												'#text':
													'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
											},
										},
									},
									'saml:AttributeStatement': {
										'saml:Attribute': [
											{
												'@Name': 'identityprovider',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:string',
													'#text': this.config.url,
												},
											},
											{
												'@Name': 'uid',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:string',
													'#text': user.id,
												},
											},
											{
												'@Name': 'displayname',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:string',
													'#text': user.name,
												},
											},
											{
												'@Name': 'name',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:string',
													'#text': user.username,
												},
											},
											{
												'@Name': 'preferred_username',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:string',
													'#text': user.username,
												},
											},
											{
												'@Name': 'profile',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:string',
													'#text': `${this.config.url}/@${user.username}`,
												},
											},
											{
												'@Name': 'picture',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:string',
													'#text': user.avatarUrl,
												},
											},
											{
												'@Name': 'mail',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:string',
													'#text': profile.email,
												},
											},
											{
												'@Name': 'email',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:string',
													'#text': profile.email,
												},
											},
											{
												'@Name': 'email_verified',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:boolean',
													'#text': profile.emailVerified,
												},
											},
											{
												'@Name': 'mfa_enabled',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:boolean',
													'#text': profile.twoFactorEnabled,
												},
											},
											{
												'@Name': 'updated_at',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:integer',
													'#text': (user.updatedAt?.getTime() ?? user.createdAt.getTime()) / 1000,
												},
											},
											{
												'@Name': 'admin',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:boolean',
													'#text': isAdministrator,
												},
											},
											{
												'@Name': 'moderator',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': {
													'@xsi:type': 'xs:boolean',
													'#text': isModerator,
												},
											},
											{
												'@Name': 'roles',
												'@NameFormat':
													'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
												'saml:AttributeValue': [
													...roles
														.filter((r) => r.isPublic)
														.map((r) => ({
															'@xsi:type': 'xs:string',
															'#text': r.id,
														})),
												],
											},
										],
									},
								},
							},
						};

						return {
							id,
							context: xmlbuilder
								.create(nodes, { encoding: 'UTF-8', standalone: false })
								.end({ pretty: false }),
						};
					},
					undefined,
					relayState,
				);

				this.#logger.info(`Rendering SAML response page for "${ssoServiceProvider.name ?? ssoServiceProvider.issuer}"`, {
					userId: user.id,
					ssoServiceProvider: ssoServiceProvider.id,
					acsUrl: ssoServiceProvider.acsUrl,
					relayState: relayState,
				});

				reply.header('Cache-Control', 'no-store');
				return await reply.view('sso-saml-post', {
					acsUrl: ssoServiceProvider.acsUrl,
					samlResponse: samlResponse,
					relyState: relayState ?? null,
				});
			} catch (err) {
				this.#logger.error('Failed to create SAML response', { error: err });
				const traceableError = err as Error & { code?: string };

				if (traceableError.code) {
					reply.status(500).send({
						error: {
							message: traceableError.message,
							code: traceableError.code,
							id: 'a743ff78-8636-4b69-a54f-e3b395564f79',
							kind: 'server',
						},
					});
					return;
				}

				reply.status(500).send({
					error: {
						message: 'Internal server error',
						code: 'INTERNAL_SERVER_ERROR',
						id: 'b83b7afd-adfc-4baf-8659-34623d639170',
						kind: 'server',
					},
				});
				return;
			} finally {
				await this.redisClient.del(`sso:saml:transaction:${transactionId}`);
			}
		});
	}
}
