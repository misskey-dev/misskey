/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { HybridTimelineChannel } from './channels/hybrid-timeline.js';
import { LocalTimelineChannel } from './channels/local-timeline.js';
import { HomeTimelineChannel } from './channels/home-timeline.js';
import { GlobalTimelineChannel } from './channels/global-timeline.js';
import { MainChannel } from './channels/main.js';
import { ChannelChannel } from './channels/channel.js';
import { AdminChannel } from './channels/admin.js';
import { ServerStatsChannel } from './channels/server-stats.js';
import { QueueStatsChannel } from './channels/queue-stats.js';
import { UserListChannel } from './channels/user-list.js';
import { AntennaChannel } from './channels/antenna.js';
import { DriveChannel } from './channels/drive.js';
import { HashtagChannel } from './channels/hashtag.js';
import { RoleTimelineChannel } from './channels/role-timeline.js';
import { ChatUserChannel } from './channels/chat-user.js';
import { ChatRoomChannel } from './channels/chat-room.js';
import { ReversiChannel } from './channels/reversi.js';
import { ReversiGameChannel } from './channels/reversi-game.js';
import type { ChannelConstructor } from './channel.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class ChannelsService {
	constructor(
	) {
	}

	@bindThis
	public getChannelConstructor(name: string): ChannelConstructor<boolean> {
		switch (name) {
			case 'main': return MainChannel;
			case 'homeTimeline': return HomeTimelineChannel;
			case 'localTimeline': return LocalTimelineChannel;
			case 'hybridTimeline': return HybridTimelineChannel;
			case 'globalTimeline': return GlobalTimelineChannel;
			case 'userList': return UserListChannel;
			case 'hashtag': return HashtagChannel;
			case 'roleTimeline': return RoleTimelineChannel;
			case 'antenna': return AntennaChannel;
			case 'channel': return ChannelChannel;
			case 'drive': return DriveChannel;
			case 'serverStats': return ServerStatsChannel;
			case 'queueStats': return QueueStatsChannel;
			case 'admin': return AdminChannel;
			case 'chatUser': return ChatUserChannel;
			case 'chatRoom': return ChatRoomChannel;
			case 'reversi': return ReversiChannel;
			case 'reversiGame': return ReversiGameChannel;

			default:
				throw new Error(`no such channel: ${name}`);
		}
	}
}
