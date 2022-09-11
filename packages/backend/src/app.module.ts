import { Module } from '@nestjs/common';
import { Notes, Users } from '@/models/index.js';
import { EndpointsModule } from '@/server/api/endpoints.module.js';
import { QueueModule } from '@/queue/queue.module.js';

@Module({
	imports: [
	EndpointsModule,
	QueueModule,
	],
	providers: [{
	provide: 'usersRepository',
	useValue: Users,
	}, {
	provide: 'notesRepository',
	useValue: Notes,
	}],
	})
export class AppModule {}
