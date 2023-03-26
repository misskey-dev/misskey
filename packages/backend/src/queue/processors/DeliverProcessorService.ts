import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, InstancesRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { MetaService } from '@/core/MetaService.js';
import { ApRequestService } from '@/core/activitypub/ApRequestService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { KVCache } from '@/misc/cache.js';
import type { Instance } from '@/models/entities/Instance.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import FederationChart from '@/core/chart/charts/federation.js';
import { StatusError } from '@/misc/status-error.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { DeliverJobData } from '../types.js';

@Injectable()
export class DeliverProcessorService {
	private logger: Logger;
	private suspendedHostsCache: KVCache<Instance[]>;
	private latest: string | null;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private metaService: MetaService,
		private utilityService: UtilityService,
		private federatedInstanceService: FederatedInstanceService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
		private apRequestService: ApRequestService,
		private instanceChart: InstanceChart,
		private apRequestChart: ApRequestChart,
		private federationChart: FederationChart,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('deliver');
		this.suspendedHostsCache = new KVCache<Instance[]>(1000 * 60 * 60);
	}

	@bindThis
	public async process(job: Bull.Job<DeliverJobData>): Promise<string> {
		const { host } = new URL(job.data.to);

		// ブロックしてたら中断
		const meta = await this.metaService.fetch();
		if (this.utilityService.isBlockedHost(meta.blockedHosts, this.utilityService.toPuny(host))) {
			return 'skip (blocked)';
		}

		// isSuspendedなら中断
		let suspendedHosts = this.suspendedHostsCache.get(null);
		if (suspendedHosts == null) {
			suspendedHosts = await this.instancesRepository.find({
				where: {
					isSuspended: true,
				},
			});
			this.suspendedHostsCache.set(null, suspendedHosts);
		}
		if (suspendedHosts.map(x => x.host).includes(this.utilityService.toPuny(host))) {
			return 'skip (suspended)';
		}

		try {
			await this.apRequestService.signedPost(job.data.user, job.data.to, job.data.content);

			// Update stats
			this.federatedInstanceService.fetch(host).then(i => {
				if (i.isNotResponding) {
					this.instancesRepository.update(i.id, {
						isNotResponding: false,
					});
					this.federatedInstanceService.updateCachePartial(host, {
						isNotResponding: false,
					});
				}

				this.fetchInstanceMetadataService.fetchInstanceMetadata(i);
				this.apRequestChart.deliverSucc();
				this.federationChart.deliverd(i.host, true);

				if (meta.enableChartsForFederatedInstances) {
					this.instanceChart.requestSent(i.host, true);
				}
			});

			return 'Success';
		} catch (res) {
			// Update stats
			this.federatedInstanceService.fetch(host).then(i => {
				if (!i.isNotResponding) {
					this.instancesRepository.update(i.id, {
						isNotResponding: true,
					});
					this.federatedInstanceService.updateCachePartial(host, {
						isNotResponding: true,
					});
				}

				this.apRequestChart.deliverFail();
				this.federationChart.deliverd(i.host, false);

				if (meta.enableChartsForFederatedInstances) {
					this.instanceChart.requestSent(i.host, false);
				}
			});

			if (res instanceof StatusError) {
				// 4xx
				if (res.isClientError) {
					// 相手が閉鎖していることを明示しているため、配送停止する
					if (job.data.isSharedInbox && res.statusCode === 410) {
						this.federatedInstanceService.fetch(host).then(i => {
							this.instancesRepository.update(i.id, {
								isSuspended: true,
							});
							this.federatedInstanceService.updateCachePartial(host, {
								isSuspended: true,
							});
						});
						return `${host} is gone`;
					}
					// HTTPステータスコード4xxはクライアントエラーであり、それはつまり
					// 何回再送しても成功することはないということなのでエラーにはしないでおく
					return `${res.statusCode} ${res.statusMessage}`;
				}

				// 5xx etc.
				throw `${res.statusCode} ${res.statusMessage}`;
			} else {
				// DNS error, socket error, timeout ...
				throw res;
			}
		}
	}
}
