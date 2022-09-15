import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import httpSignature from '@peertube/http-signature';
import { DI_SYMBOLS } from '@/di-symbols.js';
import { Instances } from '@/models/index.js';
import type { DriveFiles } from '@/models/index.js';
import { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { MetaService } from '@/services/MetaService.js';
import { extractDbHost, toPuny } from '@/misc/convert-host.js';
import { ApRequestService } from '@/services/remote/activitypub/ApRequestService.js';
import { FederatedInstanceService } from '@/services/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@/services/FetchInstanceMetadataService.js';
import { Cache } from '@/misc/cache.js';
import type { Instance } from '@/models/entities/instance.js';
import InstanceChart from '@/services/chart/charts/instance.js';
import ApRequestChart from '@/services/chart/charts/ap-request.js';
import FederationChart from '@/services/chart/charts/federation.js';
import { LdSignature } from '@/services/remote/activitypub/misc/ld-signature.js';
import { getApId } from '@/services/remote/activitypub/type.js';
import type { CacheableRemoteUser } from '@/models/entities/user.js';
import type { UserPublickey } from '@/models/entities/user-publickey.js';
import { ApDbResolverService } from '@/services/remote/activitypub/ApDbResolverService.js';
import { StatusError } from '@/misc/status-error.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { DeliverJobData, InboxJobData } from '../types.js';

// ユーザーのinboxにアクティビティが届いた時の処理
@Injectable()
export class InboxProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('instancesRepository')
		private instancesRepository: typeof Instances,

		@Inject('driveFilesRepository')
		private driveFilesRepository: typeof DriveFiles,

		private metaService: MetaService,
		private federatedInstanceService: FederatedInstanceService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
		private apRequestService: ApRequestService,
		private instanceChart: InstanceChart,
		private apRequestChart: ApRequestChart,
		private apDbResolverService: ApDbResolverService,
		private federationChart: FederationChart,
		private queueLoggerService: QueueLoggerService,
	) {
		this.queueLoggerService.logger.createSubLogger('inbox');
	}

	public async process(job: Bull.Job<InboxJobData>): Promise<string> {
		const signature = job.data.signature;	// HTTP-signature
		const activity = job.data.activity;

		//#region Log
		const info = Object.assign({}, activity) as any;
		delete info['@context'];
		this.#logger.debug(JSON.stringify(info, null, 2));
		//#endregion

		const host = toPuny(new URL(signature.keyId).hostname);

		// ブロックしてたら中断
		const meta = await this.metaService.fetch();
		if (meta.blockedHosts.includes(host)) {
			return `Blocked request: ${host}`;
		}

		const keyIdLower = signature.keyId.toLowerCase();
		if (keyIdLower.startsWith('acct:')) {
			return `Old keyId is no longer supported. ${keyIdLower}`;
		}

		// HTTP-Signature keyIdを元にDBから取得
		let authUser: {
		user: CacheableRemoteUser;
		key: UserPublickey | null;
	} | null = await this.apDbResolverService.getAuthUserFromKeyId(signature.keyId);

		// keyIdでわからなければ、activity.actorを元にDBから取得 || activity.actorを元にリモートから取得
		if (authUser == null) {
			try {
				authUser = await this.apDbResolverService.getAuthUserFromApId(getApId(activity.actor));
			} catch (e) {
			// 対象が4xxならスキップ
				if (e instanceof StatusError) {
					if (e.isClientError) {
						return `skip: Ignored deleted actors on both ends ${activity.actor} - ${e.statusCode}`;
					}
					throw `Error in actor ${activity.actor} - ${e.statusCode || e}`;
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
					await resolvePerson(candicate).catch(() => null);
				}

				// keyIdからLD-Signatureのユーザーを取得
				authUser = await dbResolver.getAuthUserFromKeyId(activity.signature.creator);
				if (authUser == null) {
					return 'skip: LD-Signatureのユーザーが取得できませんでした';
				}

				if (authUser.key == null) {
					return 'skip: LD-SignatureのユーザーはpublicKeyを持っていませんでした';
				}

				// LD-Signature検証
				const ldSignature = new LdSignature();
				const verified = await ldSignature.verifyRsaSignature2017(activity, authUser.key.keyPem).catch(() => false);
				if (!verified) {
					return 'skip: LD-Signatureの検証に失敗しました';
				}

				// もう一度actorチェック
				if (authUser.user.uri !== activity.actor) {
					return `skip: LD-Signature user(${authUser.user.uri}) !== activity.actor(${activity.actor})`;
				}

				// ブロックしてたら中断
				const ldHost = extractDbHost(authUser.user.uri);
				if (meta.blockedHosts.includes(ldHost)) {
					return `Blocked request: ${ldHost}`;
				}
			} else {
				return `skip: http-signature verification failed and no LD-Signature. keyId=${signature.keyId}`;
			}
		}

		// activity.idがあればホストが署名者のホストであることを確認する
		if (typeof activity.id === 'string') {
			const signerHost = extractDbHost(authUser.user.uri!);
			const activityIdHost = extractDbHost(activity.id);
			if (signerHost !== activityIdHost) {
				return `skip: signerHost(${signerHost}) !== activity.id host(${activityIdHost}`;
			}
		}

		// Update stats
		this.federatedInstanceService.registerOrFetchInstanceDoc(authUser.user.host).then(i => {
			Instances.update(i.id, {
				latestRequestReceivedAt: new Date(),
				lastCommunicatedAt: new Date(),
				isNotResponding: false,
			});

			this.fetchInstanceMetadataService.fetchInstanceMetadata(i);

			this.instanceChart.requestReceived(i.host);
			this.apRequestChart.inbox();
			this.federationChart.inbox(i.host);
		});

		// アクティビティを処理
		await perform(authUser.user, activity);
		return 'ok';
	}
}
