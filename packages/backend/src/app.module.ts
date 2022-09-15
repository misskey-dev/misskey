import { Module } from '@nestjs/common';
import { QueueModule } from '@/queue/queue.module.js';
import { CoreModule } from './services/CoreModule.js';
import { DI } from './di-symbols.js';
import { loadConfig } from './config.js';
import { db } from './db/postgre';
import { RepositoryModule } from './RepositoryModule.js';
import { ServerModule } from './server/ServerModule.js';

@Module({
	imports: [
		RepositoryModule,
		CoreModule,
		QueueModule,
		ServerModule,
	],
	providers: [{
		provide: DI.config,
		useValue: loadConfig(),
	}, {
		provide: DI.db,
		useValue: db,
	}],
})
export class AppModule {}
