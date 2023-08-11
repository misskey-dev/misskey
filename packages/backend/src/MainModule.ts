import { Module } from '@nestjs/common';
import { ServerModule } from '@/server/ServerModule.js';
import { GlobalModule } from '@/GlobalModule.js';
import { DaemonModule } from '@/daemons/DaemonModule.js';

@Module({
	imports: [
		GlobalModule,
		ServerModule,
		DaemonModule,
	],
})
export class MainModule {}
