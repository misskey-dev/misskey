import { Inject, Injectable } from '@/di-decorators.js';
import { DI } from '@/di-symbols.js';
import { HybridTimelineChannelService } from './channels/hybrid-timeline.js';
import { LocalTimelineChannelService } from './channels/local-timeline.js';
import { HomeTimelineChannelService } from './channels/home-timeline.js';
import { GlobalTimelineChannelService } from './channels/global-timeline.js';
import { MainChannelService } from './channels/main.js';
import { ChannelChannelService } from './channels/channel.js';
import { AdminChannelService } from './channels/admin.js';
import { ServerStatsChannelService } from './channels/server-stats.js';
import { QueueStatsChannelService } from './channels/queue-stats.js';
import { UserListChannelService } from './channels/user-list.js';
import { AntennaChannelService } from './channels/antenna.js';
import { MessagingChannelService } from './channels/messaging.js';
import { MessagingIndexChannelService } from './channels/messaging-index.js';
import { DriveChannelService } from './channels/drive.js';
import { HashtagChannelService } from './channels/hashtag.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class ChannelsService {
	constructor(
		@Inject(DI.MainChannelService)
		private mainChannelService: MainChannelService,

		@Inject(DI.HomeTimelineChannelService)
		private homeTimelineChannelService: HomeTimelineChannelService,

		@Inject(DI.LocalTimelineChannelService)
		private localTimelineChannelService: LocalTimelineChannelService,

		@Inject(DI.HybridTimelineChannelService)
		private hybridTimelineChannelService: HybridTimelineChannelService,

		@Inject(DI.GlobalTimelineChannelService)
		private globalTimelineChannelService: GlobalTimelineChannelService,

		@Inject(DI.UserListChannelService)
		private userListChannelService: UserListChannelService,

		@Inject(DI.HashtagChannelService)
		private hashtagChannelService: HashtagChannelService,

		@Inject(DI.AntennaChannelService)
		private antennaChannelService: AntennaChannelService,

		@Inject(DI.ChannelChannelService)
		private channelChannelService: ChannelChannelService,

		@Inject(DI.MessagingChannelService)
		private messagingChannelService: MessagingChannelService,

		@Inject(DI.MessagingIndexChannelService)
		private messagingIndexChannelService: MessagingIndexChannelService,

		@Inject(DI.DriveChannelService)
		private driveChannelService: DriveChannelService,

		@Inject(DI.ServerStatsChannelService)
		private serverStatsChannelService: ServerStatsChannelService,

		@Inject(DI.QueueStatsChannelService)
		private queueStatsChannelService: QueueStatsChannelService,

		@Inject(DI.AdminChannelService)
		private adminChannelService: AdminChannelService,
	) {
	}

	@bindThis
	public getChannelService(name: string) {
		switch (name) {
			case 'main': return this.mainChannelService;
			case 'homeTimeline': return this.homeTimelineChannelService;
			case 'localTimeline': return this.localTimelineChannelService;
			case 'hybridTimeline': return this.hybridTimelineChannelService;
			case 'globalTimeline': return this.globalTimelineChannelService;
			case 'userList': return this.userListChannelService;
			case 'hashtag': return this.hashtagChannelService;
			case 'antenna': return this.antennaChannelService;
			case 'channel': return this.channelChannelService;
			case 'messaging': return this.messagingChannelService;
			case 'messagingIndex': return this.messagingIndexChannelService;
			case 'drive': return this.driveChannelService;
			case 'serverStats': return this.serverStatsChannelService;
			case 'queueStats': return this.queueStatsChannelService;
			case 'admin': return this.adminChannelService;
		
			default:
				throw new Error(`no such channel: ${name}`);
		}
	}
}
