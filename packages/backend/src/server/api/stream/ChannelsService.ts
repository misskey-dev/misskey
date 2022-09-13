import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import { HybridTimelineChannelService } from './channels/hybrid-timeline.js';
import { LocalTimelineChannelService } from './channels/local-timeline.js';
import { HomeTimelineChannelService } from './channels/home-timeline.js';
import { GlobalTimelineChannelService } from './channels/global-timeline.js';
import { MainChannelService } from './channels/main.js';

@Injectable()
export class ChannelsService {
	constructor(
		private mainChannelService: MainChannelService,
		private homeTimelineChannelService: HomeTimelineChannelService,
		private localTimelineChannelService: LocalTimelineChannelService,
		private hybridTimelineChannelService: HybridTimelineChannelService,
		private globalTimelineChannelService: GlobalTimelineChannelService,
	) {
	}

	public getChannelService(name: string) {
		switch (name) {
			case 'main': return this.mainChannelService;
			case 'homeTimeline': return this.homeTimelineChannelService;
			case 'localTimeline': return this.localTimelineChannelService;
			case 'hybridTimeline': return this.hybridTimelineChannelService;
			case 'globalTimeline': return this.globalTimelineChannelService;
		
			default:
				throw new Error(`no such channel: ${name}`);
		}
	}
}

	serverStats,
	queueStats,
	userList,
	antenna,
	messaging,
	messagingIndex,
	drive,
	hashtag,
	channel,
	admin,
