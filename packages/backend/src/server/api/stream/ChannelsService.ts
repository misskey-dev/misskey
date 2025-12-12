/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { MiChannelService } from './channel.js';
import type { AdminChannelService } from './channels/admin.js';
import type { AntennaChannelService } from './channels/antenna.js';
import type { ChannelChannelService } from './channels/channel.js';
import type { ChatRoomChannelService } from './channels/chat-room.js';
import type { ChatUserChannelService } from './channels/chat-user.js';
import type { DriveChannelService } from './channels/drive.js';
import type { GlobalTimelineChannelService } from './channels/global-timeline.js';
import type { HashtagChannelService } from './channels/hashtag.js';
import type { HomeTimelineChannelService } from './channels/home-timeline.js';
import type { HybridTimelineChannelService } from './channels/hybrid-timeline.js';
import type { LocalTimelineChannelService } from './channels/local-timeline.js';
import type { MainChannelService } from './channels/main.js';
import type { QueueStatsChannelService } from './channels/queue-stats.js';
import type { ReversiChannelService } from './channels/reversi.js';
import type { ReversiGameChannelService } from './channels/reversi-game.js';
import type { RoleTimelineChannelService } from './channels/role-timeline.js';
import type { ServerStatsChannelService } from './channels/server-stats.js';
import type { UserListChannelService } from './channels/user-list.js';

@Injectable()
export class ChannelsService {
	constructor(
		private mainChannelService: MainChannelService,
		private homeTimelineChannelService: HomeTimelineChannelService,
		private localTimelineChannelService: LocalTimelineChannelService,
		private hybridTimelineChannelService: HybridTimelineChannelService,
		private globalTimelineChannelService: GlobalTimelineChannelService,
		private userListChannelService: UserListChannelService,
		private hashtagChannelService: HashtagChannelService,
		private roleTimelineChannelService: RoleTimelineChannelService,
		private antennaChannelService: AntennaChannelService,
		private channelChannelService: ChannelChannelService,
		private driveChannelService: DriveChannelService,
		private serverStatsChannelService: ServerStatsChannelService,
		private queueStatsChannelService: QueueStatsChannelService,
		private adminChannelService: AdminChannelService,
		private chatUserChannelService: ChatUserChannelService,
		private chatRoomChannelService: ChatRoomChannelService,
		private reversiChannelService: ReversiChannelService,
		private reversiGameChannelService: ReversiGameChannelService,
	) {
	}

	@bindThis
	public getChannelService(name: string): MiChannelService<boolean> {
		switch (name) {
			case 'main': return this.mainChannelService;
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
			case 'chatUser': return this.chatUserChannelService;
			case 'chatRoom': return this.chatRoomChannelService;
			case 'reversi': return this.reversiChannelService;
			case 'reversiGame': return this.reversiGameChannelService;

			default:
				throw new Error(`no such channel: ${name}`);
		}
	}
}
