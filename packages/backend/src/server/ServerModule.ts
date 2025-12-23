/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { EndpointsModule } from '@/server/api/EndpointsModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { ApiCallService } from './api/ApiCallService.js';
import { FileServerService } from './FileServerService.js';
import { HealthServerService } from './HealthServerService.js';
import { NodeinfoServerService } from './NodeinfoServerService.js';
import { ServerService } from './ServerService.js';
import { WellKnownServerService } from './WellKnownServerService.js';
import { GetterService } from './api/GetterService.js';
import { ActivityPubServerService } from './ActivityPubServerService.js';
import { ApiLoggerService } from './api/ApiLoggerService.js';
import { ApiServerService } from './api/ApiServerService.js';
import { AuthenticateService } from './api/AuthenticateService.js';
import { RateLimiterService } from './api/RateLimiterService.js';
import { SigninApiService } from './api/SigninApiService.js';
import { SigninService } from './api/SigninService.js';
import { SignupApiService } from './api/SignupApiService.js';
import { StreamingApiServerService } from './api/StreamingApiServerService.js';
import { OpenApiServerService } from './api/openapi/OpenApiServerService.js';
import { ClientServerService } from './web/ClientServerService.js';
import { HtmlTemplateService } from './web/HtmlTemplateService.js';
import { FeedService } from './web/FeedService.js';
import { UrlPreviewService } from './web/UrlPreviewService.js';
import { ClientLoggerService } from './web/ClientLoggerService.js';
import { OAuth2ProviderService } from './oauth/OAuth2ProviderService.js';

import MainStreamConnection from '@/server/api/stream/Connection.js';
import { MainChannel } from './api/stream/channels/main.js';
import { AdminChannel } from './api/stream/channels/admin.js';
import { AntennaChannel } from './api/stream/channels/antenna.js';
import { ChannelChannel } from './api/stream/channels/channel.js';
import { DriveChannel } from './api/stream/channels/drive.js';
import { GlobalTimelineChannel } from './api/stream/channels/global-timeline.js';
import { HashtagChannel } from './api/stream/channels/hashtag.js';
import { HomeTimelineChannel } from './api/stream/channels/home-timeline.js';
import { HybridTimelineChannel } from './api/stream/channels/hybrid-timeline.js';
import { LocalTimelineChannel } from './api/stream/channels/local-timeline.js';
import { QueueStatsChannel } from './api/stream/channels/queue-stats.js';
import { ServerStatsChannel } from './api/stream/channels/server-stats.js';
import { UserListChannel } from './api/stream/channels/user-list.js';
import { RoleTimelineChannel } from './api/stream/channels/role-timeline.js';
import { ChatUserChannel } from './api/stream/channels/chat-user.js';
import { ChatRoomChannel } from './api/stream/channels/chat-room.js';
import { ReversiChannel } from './api/stream/channels/reversi.js';
import { ReversiGameChannel } from './api/stream/channels/reversi-game.js';
import { SigninWithPasskeyApiService } from './api/SigninWithPasskeyApiService.js';

@Module({
	imports: [
		EndpointsModule,
		CoreModule,
	],
	providers: [
		ClientServerService,
		ClientLoggerService,
		HtmlTemplateService,
		FeedService,
		HealthServerService,
		UrlPreviewService,
		ActivityPubServerService,
		FileServerService,
		NodeinfoServerService,
		ServerService,
		WellKnownServerService,
		GetterService,
		MainStreamConnection,
		ApiCallService,
		ApiLoggerService,
		ApiServerService,
		AuthenticateService,
		RateLimiterService,
		SigninApiService,
		SigninWithPasskeyApiService,
		SigninService,
		SignupApiService,
		StreamingApiServerService,
		MainChannel,
		AdminChannel,
		AntennaChannel,
		ChannelChannel,
		DriveChannel,
		GlobalTimelineChannel,
		HashtagChannel,
		RoleTimelineChannel,
		ChatUserChannel,
		ChatRoomChannel,
		ReversiChannel,
		ReversiGameChannel,
		HomeTimelineChannel,
		HybridTimelineChannel,
		LocalTimelineChannel,
		QueueStatsChannel,
		ServerStatsChannel,
		UserListChannel,
		OpenApiServerService,
		OAuth2ProviderService,
	],
	exports: [
		ServerService,
	],
})
export class ServerModule {}
