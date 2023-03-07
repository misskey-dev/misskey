import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import httpSignature from '@peertube/http-signature';
import { DI } from '@/di-symbols.js';
import type { InstancesRepository, DriveFilesRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { MetaService } from '@/core/MetaService.js';
import { ApRequestService } from '@/core/activitypub/ApRequestService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import FederationChart from '@/core/chart/charts/federation.js';
import { getApId } from '@/core/activitypub/type.js';
import type { RemoteUser } from '@/models/entities/User.js';
import type { UserPublickey } from '@/models/entities/UserPublickey.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { StatusError } from '@/misc/status-error.js';
import { UtilityService } from '@/core/UtilityService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { LdSignatureService } from '@/core/activitypub/LdSignatureService.js';
import { ApInboxService } from '@/core/activitypub/ApInboxService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { InboxJobData } from '../types.js';

// ユーザーのinboxにアクティビティが届いた時の処理
@Injectable()
export class InboxProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private utilityService: UtilityService,
		private metaService: MetaService,
		private apInboxService: ApInboxService,
		private federatedInstanceService: FederatedInstanceService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
		private ldSignatureService: LdSignatureService,
		private apRequestService: ApRequestService,
		private apPersonService: ApPersonService,
		private apDbResolverService: ApDbResolverService,
		private instanceChart: InstanceChart,
		private apRequestChart: ApRequestChart,
		private federationChart: FederationChart,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('inbox');
	}

	@bindThis
	public async process(job: Bull.Job<InboxJobData>): Promise<string> {
		const signature = job.data.signature;	// HTTP-signature
		const activity = job.data.activity;

		//#region Log
		const info = Object.assign({}, activity) as any;
		delete info['@context'];
		this.logger.debug(JSON.stringify(info, null, 2));
		//#endregion

		const host = this.utilityService.toPuny(new URL(signature.keyId).hostname);

		// ブロックしてたら中断
		const meta = await this.metaService.fetch();
		if (this.utilityService.isBlockedHost(meta.blockedHosts, host)) {
			return `Blocked request: ${host}`;
		}

		const keyIdLower = signature.keyId.toLowerCase();
		if (keyIdLower.startsWith('acct:')) {
			return `Old keyId is no longer supported. ${keyIdLower}`;
		}

		// HTTP-Signature keyIdを元にDBから取得
		let authUser: {
		user: RemoteUser;
		key: UserPublickey | null;
	} | null = await this.apDbResolverService.getAuthUserFromKeyId(signature.keyId);

		// keyIdでわからなければ、activity.actorを元にDBから取得 || activity.actorを元にリモートから取得
		if (authUser == null) {
			try {
				authUser = await this.apDbResolverService.getAuthUserFromApId(getApId(activity.actor));
			} catch (err) {
			// 対象が4xxならスキップ
				if (err instanceof StatusError) {
					if (err.isClientError) {
						return `skip: Ignored deleted actors on both ends ${activity.actor} - ${err.statusCode}`;
					}
					throw `Error in actor ${activity.actor} - ${err.statusCode ?? err}`;
				}
			}
		}

		// それでもわからなければ終了
		if (authUser == null) {
			return 'skip: failed to resolve user';
		}

		// publicKey がなくても終了
		if (authUser.key == null) {
			return 'skip: failed to resolve user publicKey';
		}

		// HTTP-Signatureの検証
		const httpSignatureValidated = httpSignature.verifySignature(signature, authUser.key.keyPem);

		// また、signatureのsignerは、activity.actorと一致する必要がある
		if (!httpSignatureValidated || authUser.user.uri !== activity.actor) {
		// 一致しなくても、でもLD-Signatureがありそうならそっちも見る
			if (activity.signature) {
				if (activity.signature.type !== 'RsaSignature2017') {
					return `skip: unsupported LD-signature type ${activity.signature.type}`;
				}

				// activity.signature.creator: https://example.oom/users/user#main-key
				// みたいになっててUserを引っ張れば公開キーも入ることを期待する
				if (activity.signature.creator) {
					const candicate = activity.signature.creator.replace(/#.*/, '');
					await this.apPersonService.resolvePerson(candicate).catch(() => null);
				}

				// keyIdからLD-Signatureのユーザーを取得
				authUser = await this.apDbResolverService.getAuthUserFromKeyId(activity.signature.creator);
				if (authUser == null) {
					return 'skip: LD-Signatureのユーザーが取得できませんでした';
				}

				if (authUser.key == null) {
					return 'skip: LD-SignatureのユーザーはpublicKeyを持っていませんでした';
				}

				// LD-Signature検証
				const ldSignature = this.ldSignatureService.use();
				const verified = await ldSignature.verifyRsaSignature2017(activity, authUser.key.keyPem).catch(() => false);
				if (!verified) {
					return 'skip: LD-Signatureの検証に失敗しました';
				}

				// もう一度actorチェック
				if (authUser.user.uri !== activity.actor) {
					return `skip: LD-Signature user(${authUser.user.uri}) !== activity.actor(${activity.actor})`;
				}

				// ブロックしてたら中断
				const ldHost = this.utilityService.extractDbHost(authUser.user.uri);
				if (this.utilityService.isBlockedHost(meta.blockedHosts, ldHost)) {
					return `Blocked request: ${ldHost}`;
				}
			} else {
				return `skip: http-signature verification failed and no LD-Signature. keyId=${signature.keyId}`;
			}
		}

		// activity.idがあればホストが署名者のホストであることを確認する
		if (typeof activity.id === 'string') {
			const signerHost = this.utilityService.extractDbHost(authUser.user.uri!);
			const activityIdHost = this.utilityService.extractDbHost(activity.id);
			if (signerHost !== activityIdHost) {
				return `skip: signerHost(${signerHost}) !== activity.id host(${activityIdHost}`;
			}
		}

		// Update stats
		this.federatedInstanceService.fetch(authUser.user.host).then(i => {
			this.instancesRepository.update(i.id, {
				latestRequestReceivedAt: new Date(),
				isNotResponding: false,
			});
			this.federatedInstanceService.updateCachePartial(host, {
				isNotResponding: false,
			});

			this.fetchInstanceMetadataService.fetchInstanceMetadata(i);

			this.instanceChart.requestReceived(i.host);
			this.apRequestChart.inbox();
			this.federationChart.inbox(i.host);
		});

		// アクティビティを処理
		await this.apInboxService.performActivity(authUser.user, activity);
		return 'ok';
	}
}
