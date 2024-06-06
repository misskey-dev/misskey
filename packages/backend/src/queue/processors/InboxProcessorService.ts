/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Injectable } from '@nestjs/common';
import httpSignature from '@peertube/http-signature';
import * as Bull from 'bullmq';
import type Logger from '@/logger.js';
import { MetaService } from '@/core/MetaService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import FederationChart from '@/core/chart/charts/federation.js';
import { getApId } from '@/core/activitypub/type.js';
import type { IActivity } from '@/core/activitypub/type.js';
import type { MiRemoteUser } from '@/models/User.js';
import type { MiUserPublickey } from '@/models/UserPublickey.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { StatusError } from '@/misc/status-error.js';
import { UtilityService } from '@/core/UtilityService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { JsonLdService } from '@/core/activitypub/JsonLdService.js';
import { ApInboxService } from '@/core/activitypub/ApInboxService.js';
import { bindThis } from '@/decorators.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type { InboxJobData } from '../types.js';

@Injectable()
export class InboxProcessorService {
	private logger: Logger;

	constructor(
		private utilityService: UtilityService,
		private metaService: MetaService,
		private apInboxService: ApInboxService,
		private federatedInstanceService: FederatedInstanceService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
		private jsonLdService: JsonLdService,
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
		let activity = job.data.activity;

		//#region Log
		const info = Object.assign({}, activity);
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
			user: MiRemoteUser;
			key: MiUserPublickey | null;
		} | null = await this.apDbResolverService.getAuthUserFromKeyId(signature.keyId);

		// keyIdでわからなければ、activity.actorを元にDBから取得 || activity.actorを元にリモートから取得
		if (authUser == null) {
			try {
				authUser = await this.apDbResolverService.getAuthUserFromApId(getApId(activity.actor));
			} catch (err) {
				// 対象が4xxならスキップ
				if (err instanceof StatusError) {
					if (!err.isRetryable) {
						throw new Bull.UnrecoverableError(`skip: Ignored deleted actors on both ends ${activity.actor} - ${err.statusCode}`);
					}
					throw new Error(`Error in actor ${activity.actor} - ${err.statusCode}`);
				}
			}
		}

		// それでもわからなければ終了
		if (authUser == null) {
			throw new Bull.UnrecoverableError('skip: failed to resolve user');
		}

		// publicKey がなくても終了
		if (authUser.key == null) {
			throw new Bull.UnrecoverableError('skip: failed to resolve user publicKey');
		}

		// HTTP-Signatureの検証
		const httpSignatureValidated = httpSignature.verifySignature(signature, authUser.key.keyPem);

		// また、signatureのsignerは、activity.actorと一致する必要がある
		if (!httpSignatureValidated || authUser.user.uri !== activity.actor) {
			// 一致しなくても、でもLD-Signatureがありそうならそっちも見る
			const ldSignature = activity.signature;
			if (ldSignature) {
				if (ldSignature.type !== 'RsaSignature2017') {
					throw new Bull.UnrecoverableError(`skip: unsupported LD-signature type ${ldSignature.type}`);
				}

				// ldSignature.creator: https://example.oom/users/user#main-key
				// みたいになっててUserを引っ張れば公開キーも入ることを期待する
				if (ldSignature.creator) {
					const candicate = ldSignature.creator.replace(/#.*/, '');
					await this.apPersonService.resolvePerson(candicate).catch(() => null);
				}

				// keyIdからLD-Signatureのユーザーを取得
				authUser = await this.apDbResolverService.getAuthUserFromKeyId(ldSignature.creator);
				if (authUser == null) {
					throw new Bull.UnrecoverableError('skip: LD-Signatureのユーザーが取得できませんでした');
				}

				if (authUser.key == null) {
					throw new Bull.UnrecoverableError('skip: LD-SignatureのユーザーはpublicKeyを持っていませんでした');
				}

				const jsonLd = this.jsonLdService.use();

				// LD-Signature検証
				const verified = await jsonLd.verifyRsaSignature2017(activity, authUser.key.keyPem).catch(() => false);
				if (!verified) {
					throw new Bull.UnrecoverableError('skip: LD-Signatureの検証に失敗しました');
				}

				// アクティビティを正規化
				delete activity.signature;
				try {
					activity = await jsonLd.compact(activity) as IActivity;
				} catch (e) {
					throw new Bull.UnrecoverableError(`skip: failed to compact activity: ${e}`);
				}
				// TODO: 元のアクティビティと非互換な形に正規化される場合は転送をスキップする
				// https://github.com/mastodon/mastodon/blob/664b0ca/app/services/activitypub/process_collection_service.rb#L24-L29
				activity.signature = ldSignature;

				//#region Log
				const compactedInfo = Object.assign({}, activity);
				delete compactedInfo['@context'];
				this.logger.debug(`compacted: ${JSON.stringify(compactedInfo, null, 2)}`);
				//#endregion

				// もう一度actorチェック
				if (authUser.user.uri !== activity.actor) {
					throw new Bull.UnrecoverableError(`skip: LD-Signature user(${authUser.user.uri}) !== activity.actor(${activity.actor})`);
				}

				// ブロックしてたら中断
				const ldHost = this.utilityService.extractDbHost(authUser.user.uri);
				if (this.utilityService.isBlockedHost(meta.blockedHosts, ldHost)) {
					throw new Bull.UnrecoverableError(`Blocked request: ${ldHost}`);
				}
			} else {
				throw new Bull.UnrecoverableError(`skip: http-signature verification failed and no LD-Signature. keyId=${signature.keyId}`);
			}
		}

		// activity.idがあればホストが署名者のホストであることを確認する
		if (typeof activity.id === 'string') {
			const signerHost = this.utilityService.extractDbHost(authUser.user.uri!);
			const activityIdHost = this.utilityService.extractDbHost(activity.id);
			if (signerHost !== activityIdHost) {
				throw new Bull.UnrecoverableError(`skip: signerHost(${signerHost}) !== activity.id host(${activityIdHost}`);
			}
		}

		// Update stats
		this.federatedInstanceService.fetch(authUser.user.host).then(i => {
			this.federatedInstanceService.update(i.id, {
				latestRequestReceivedAt: new Date(),
				isNotResponding: false,
				// もしサーバーが死んでるために配信が止まっていた場合には自動的に復活させてあげる
				suspensionState: i.suspensionState === 'autoSuspendedForNotResponding' ? 'none' : undefined,
			});

			this.fetchInstanceMetadataService.fetchInstanceMetadata(i);

			this.apRequestChart.inbox();
			this.federationChart.inbox(i.host);

			if (meta.enableChartsForFederatedInstances) {
				this.instanceChart.requestReceived(i.host);
			}
		});

		// アクティビティを処理
		try {
			const result = await this.apInboxService.performActivity(authUser.user, activity);
			if (result && !result.startsWith('ok')) {
				this.logger.warn(`inbox activity ignored (maybe): id=${activity.id} reason=${result}`);
				return result;
			}
		} catch (e) {
			if (e instanceof IdentifiableError) {
				if (e.id === '689ee33f-f97c-479a-ac49-1b9f8140af99') {
					return 'blocked notes with prohibited words';
				}
				if (e.id === '85ab9bd7-3a41-4530-959d-f07073900109') {
					return 'actor has been suspended';
				}
				if (e.id === 'd450b8a9-48e4-4dab-ae36-f4db763fda7c') { // invalid Note
					return e.message;
				}
			}
			throw e;
		}
		return 'ok';
	}
}
