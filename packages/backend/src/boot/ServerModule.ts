import { Ctor, IServiceCollection, addSingletonCtor } from 'yohira';
import { DI } from '@/di-symbols.js';
import { ApiCallService } from '@/server/api/ApiCallService.js';
import { FileServerService } from '@/server/FileServerService.js';
import { NodeinfoServerService } from '@/server/NodeinfoServerService.js';
import { ServerService } from '@/server/ServerService.js';
import { WellKnownServerService } from '@/server/WellKnownServerService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ChannelsService } from '@/server/api/stream/ChannelsService.js';
import { ActivityPubServerService } from '@/server/ActivityPubServerService.js';
import { ApiLoggerService } from '@/server/api/ApiLoggerService.js';
import { ApiServerService } from '@/server/api/ApiServerService.js';
import { AuthenticateService } from '@/server/api/AuthenticateService.js';
import { RateLimiterService } from '@/server/api/RateLimiterService.js';
import { SigninApiService } from '@/server/api/SigninApiService.js';
import { SigninService } from '@/server/api/SigninService.js';
import { SignupApiService } from '@/server/api/SignupApiService.js';
import { StreamingApiServerService } from '@/server/api/StreamingApiServerService.js';
import { ClientServerService } from '@/server/web/ClientServerService.js';
import { FeedService } from '@/server/web/FeedService.js';
import { UrlPreviewService } from '@/server/web/UrlPreviewService.js';
import { MainChannelService } from '@/server/api/stream/channels/main.js';
import { AdminChannelService } from '@/server/api/stream/channels/admin.js';
import { AntennaChannelService } from '@/server/api/stream/channels/antenna.js';
import { ChannelChannelService } from '@/server/api/stream/channels/channel.js';
import { DriveChannelService } from '@/server/api/stream/channels/drive.js';
import { GlobalTimelineChannelService } from '@/server/api/stream/channels/global-timeline.js';
import { HashtagChannelService } from '@/server/api/stream/channels/hashtag.js';
import { HomeTimelineChannelService } from '@/server/api/stream/channels/home-timeline.js';
import { HybridTimelineChannelService } from '@/server/api/stream/channels/hybrid-timeline.js';
import { LocalTimelineChannelService } from '@/server/api/stream/channels/local-timeline.js';
import { QueueStatsChannelService } from '@/server/api/stream/channels/queue-stats.js';
import { ServerStatsChannelService } from '@/server/api/stream/channels/server-stats.js';
import { UserListChannelService } from '@/server/api/stream/channels/user-list.js';
import { OpenApiServerService } from '@/server/api/openapi/OpenApiServerService.js';

const ServerServices: readonly (readonly [symbol, Ctor<object>])[] = [
	[DI.ClientServerService, ClientServerService],
	[DI.FeedService, FeedService],
	[DI.UrlPreviewService, UrlPreviewService],
	[DI.ActivityPubServerService, ActivityPubServerService],
	[DI.FileServerService, FileServerService],
	[DI.NodeinfoServerService, NodeinfoServerService],
	[DI.ServerService, ServerService],
	[DI.WellKnownServerService, WellKnownServerService],
	[DI.GetterService, GetterService],
	[DI.ChannelsService, ChannelsService],
	[DI.ApiCallService, ApiCallService],
	[DI.ApiLoggerService, ApiLoggerService],
	[DI.ApiServerService, ApiServerService],
	[DI.AuthenticateService, AuthenticateService],
	[DI.RateLimiterService, RateLimiterService],
	[DI.SigninApiService, SigninApiService],
	[DI.SigninService, SigninService],
	[DI.SignupApiService, SignupApiService],
	[DI.StreamingApiServerService, StreamingApiServerService],
	[DI.MainChannelService, MainChannelService],
	[DI.AdminChannelService, AdminChannelService],
	[DI.AntennaChannelService, AntennaChannelService],
	[DI.ChannelChannelService, ChannelChannelService],
	[DI.DriveChannelService, DriveChannelService],
	[DI.GlobalTimelineChannelService, GlobalTimelineChannelService],
	[DI.HashtagChannelService, HashtagChannelService],
	[DI.HomeTimelineChannelService, HomeTimelineChannelService],
	[DI.HybridTimelineChannelService, HybridTimelineChannelService],
	[DI.LocalTimelineChannelService, LocalTimelineChannelService],
	[DI.QueueStatsChannelService, QueueStatsChannelService],
	[DI.ServerStatsChannelService, ServerStatsChannelService],
	[DI.UserListChannelService, UserListChannelService],
	[DI.OpenApiServerService, OpenApiServerService],
];

export function addServerServices(services: IServiceCollection): void {
	for (const [serviceType, implCtor] of ServerServices) {
		addSingletonCtor(services, serviceType, implCtor);
	}
}
