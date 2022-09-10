import { Module } from '@nestjs/common';
import { Notes } from '@/models/index.js';

@Module({
	imports: [
	],
	providers: [{
	provide: 'notesRepository',
	useValue: Notes,
	}],
	})
export class AppModule {}
