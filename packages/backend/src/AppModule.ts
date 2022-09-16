import { Module } from '@nestjs/common';
import { QueueModule } from '@/services/queue/QueueModule.js';
import { CoreModule } from './services/CoreModule.js';
import { ServerModule } from './server/ServerModule.js';
import { GlobalModule } from './GlobalModule.js';
import { QueueProcessorModule } from './queue/QueueProcessorModule.js';

@Module({
	imports: [
		GlobalModule,
		CoreModule,
		QueueModule,
		ServerModule,
		QueueProcessorModule,
	],
})
export class AppModule {}
