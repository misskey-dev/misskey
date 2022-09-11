import { Module } from '@nestjs/common';
import { Notes } from '@/models/index.js';
import { EndpointsModule } from '@/server/api/endpoints.module.js';

@Module({
	imports: [
	EndpointsModule,
	],
	providers: [{
	provide: 'notesRepository',
	useValue: Notes,
	}],
	})
export class AppModule {}
