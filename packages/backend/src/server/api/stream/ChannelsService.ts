/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { HybridTimelineChannelService } from './channels/hybrid-timeline.js';
import { LocalTimelineChannelService } from './channels/local-timeline.js';
import { HomeTimelineChannelService } from './channels/home-timeline.js';
import { YamiTimelineChannelService } from './channels/yami-timeline.js';
import { GlobalTimelineChannelService } from './channels/global-timeline.js';
import { MainChannelService } from './channels/main.js';
import { ChannelChannelService } from './channels/channel.js';
import { AdminChannelService } from './channels/admin.js';
import { ServerStatsChannelService } from './channels/server-stats.js';
import { QueueStatsChannelService } from './channels/queue-stats.js';
import { UserListChannelService } from './channels/user-list.js';
import { AntennaChannelService } from './channels/antenna.js';
import { DriveChannelService } from './channels/drive.js';
import { HashtagChannelService } from './channels/hashtag.js';
import { RoleTimelineChannelService } from './channels/role-timeline.js';
import { ReversiChannelService } from './channels/reversi.js';
import { ReversiGameChannelService } from './channels/reversi-game.js';
import { type MiChannelService } from './channel.js';

@Injectable()
export class ChannelsService {
	    constructor(
		        @Inject(forwardRef(() => MainChannelService))
		        private mainChannelService: MainChannelService,
		        @Inject(forwardRef(() => YamiTimelineChannelService))
		        private yamiTimelineChannelService: YamiTimelineChannelService,
		        @Inject(forwardRef(() => HomeTimelineChannelService))
		        private homeTimelineChannelService: HomeTimelineChannelService,
		        @Inject(forwardRef(() => LocalTimelineChannelService))
		        private localTimelineChannelService: LocalTimelineChannelService,
		        @Inject(forwardRef(() => HybridTimelineChannelService))
		        private hybridTimelineChannelService: HybridTimelineChannelService,
		        @Inject(forwardRef(() => GlobalTimelineChannelService))
		        private globalTimelineChannelService: GlobalTimelineChannelService,
		        @Inject(forwardRef(() => UserListChannelService))
		        private userListChannelService: UserListChannelService,
		        @Inject(forwardRef(() => HashtagChannelService))
		        private hashtagChannelService: HashtagChannelService,
		        @Inject(forwardRef(() => RoleTimelineChannelService))
		        private roleTimelineChannelService: RoleTimelineChannelService,
		        @Inject(forwardRef(() => AntennaChannelService))
		        private antennaChannelService: AntennaChannelService,
		        @Inject(forwardRef(() => ChannelChannelService))
		        private channelChannelService: ChannelChannelService,
		        @Inject(forwardRef(() => DriveChannelService))
		        private driveChannelService: DriveChannelService,
		        @Inject(forwardRef(() => ServerStatsChannelService))
		        private serverStatsChannelService: ServerStatsChannelService,
		        @Inject(forwardRef(() => QueueStatsChannelService))
		        private queueStatsChannelService: QueueStatsChannelService,
		        @Inject(forwardRef(() => AdminChannelService))
		        private adminChannelService: AdminChannelService,
		        @Inject(forwardRef(() => ReversiChannelService))
		        private reversiChannelService: ReversiChannelService,
		        @Inject(forwardRef(() => ReversiGameChannelService))
		        private reversiGameChannelService: ReversiGameChannelService,
		    ) {
		    }

	@bindThis
	public getChannelService(name: string): MiChannelService<boolean> {
		switch (name) {
			case 'main': return this.mainChannelService;
			case 'yamiTimeline': return this.yamiTimelineChannelService;
			case 'homeTimeline': return this.homeTimelineChannelService;
			case 'localTimeline': return this.localTimelineChannelService;
			case 'hybridTimeline': return this.hybridTimelineChannelService;
			case 'globalTimeline': return this.globalTimelineChannelService;
			case 'userList': return this.userListChannelService;
			case 'hashtag': return this.hashtagChannelService;
			case 'roleTimeline': return this.roleTimelineChannelService;
			case 'antenna': return this.antennaChannelService;
			case 'channel': return this.channelChannelService;
			case 'drive': return this.driveChannelService;
			case 'serverStats': return this.serverStatsChannelService;
			case 'queueStats': return this.queueStatsChannelService;
			case 'admin': return this.adminChannelService;
			case 'reversi': return this.reversiChannelService;
			case 'reversiGame': return this.reversiGameChannelService;

			default:
				throw new Error(`no such channel: ${name}`);
		}
	}
}
