import { Module } from '@nestjs/common';
import { EndpointsModule } from '@/server/api/EndpointsModule.js';
import { CoreModule } from '@/services/CoreModule.js';
import { ApiCallService } from './api/ApiCallService.js';
import { FileServerService } from './FileServerService.js';
import { MediaProxyServerService } from './MediaProxyServerService.js';
import { NodeinfoServerService } from './NodeinfoServerService.js';
import { ServerService } from './ServerService.js';
import { WellKnownServerService } from './WellKnownServerService.js';
import { GetterService } from './api/common/GetterService.js';
import { DiscordServerService } from './api/integration/DiscordServerService.js';
import { GithubServerService } from './api/integration/GithubServerService.js';
import { TwitterServerService } from './api/integration/TwitterServerService.js';
import { ChannelsService } from './api/stream/ChannelsService.js';
import { ActivityPubServerService } from './ActivityPubServerService.js';
import { ApiLoggerService } from './api/ApiLoggerService.js';
import { ApiServerService } from './api/ApiServerService.js';
import { AuthenticateService } from './api/AuthenticateService.js';
import { RateLimiterService } from './api/RateLimiterService.js';
import { SigninApiService } from './api/SigninApiService.js';
import { SigninService } from './api/SigninService.js';
import { SignupApiService } from './api/SignupApiService.js';
import { StreamingApiServerService } from './api/StreamingApiServerService.js';
import { ClientServerService } from './web/ClientServerService.js';
import { FeedService } from './web/FeedService.js';
import { UrlPreviewService } from './web/UrlPreviewService.js';

@Module({
	imports: [
		EndpointsModule,
		CoreModule,
	],
	providers: [
		ClientServerService,
		FeedService,
		UrlPreviewService,
		ActivityPubServerService,
		FileServerService,
		MediaProxyServerService,
		NodeinfoServerService,
		ServerService,
		WellKnownServerService,
		GetterService,
		DiscordServerService,
		GithubServerService,
		TwitterServerService,
		ChannelsService,
		ApiCallService,
		ApiLoggerService,
		ApiServerService,
		AuthenticateService,
		RateLimiterService,
		SigninApiService,
		SigninService,
		SignupApiService,
		StreamingApiServerService,
	],
	exports: [
		ServerService,
	],
})
export class ServerModule {}
