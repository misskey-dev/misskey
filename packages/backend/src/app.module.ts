import { Module } from '@nestjs/common';
import { Notes, Users } from '@/models/index.js';
import { EndpointsModule } from '@/server/api/endpoints.module.js';
import { QueueModule } from '@/queue/queue.module.js';
import { ChartsModule } from './services/chart/charts.module';
import { DI_SYMBOLS } from './di-symbols';
import { loadConfig } from './config/load';

@Module({
	imports: [
	ChartsModule,
	EndpointsModule,
	QueueModule,
	],
	providers: [{
	provide: DI_SYMBOLS.config,
	useValue: loadConfig(),
	}, {
	provide: 'usersRepository',
	useValue: Users,
	}, {
	provide: 'notesRepository',
	useValue: Notes,
	}],
	})
export class AppModule {}
