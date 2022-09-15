import { Module } from '@nestjs/common';
import { EndpointsModule } from '@/server/api/endpoints.module.js';
import { QueueModule } from '@/queue/queue.module.js';
import { CoreModule } from './services/CoreModule.js';
import { DI } from './di-symbols.js';
import { loadConfig } from './config.js';
import { db } from './db/postgre';
import { RepositoryModule } from './RepositoryModule.js';

@Module({
	imports: [
		RepositoryModule,
		CoreModule,
		EndpointsModule,
		QueueModule,
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
