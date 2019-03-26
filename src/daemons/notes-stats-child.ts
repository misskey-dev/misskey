import { MoreThanOrEqual, getRepository } from 'typeorm';
import { Note } from '../models/entities/note';
import { initMainPostgre } from '../db/pg-connections/main';

const interval = 5000;

initMainPostgre().then(() => {
	const Notes = getRepository(Note);

	async function tick() {
		const [all, local] = await Promise.all([Notes.count({
			createdAt: MoreThanOrEqual(new Date(Date.now() - interval))
		}), Notes.count({
			createdAt: MoreThanOrEqual(new Date(Date.now() - interval)),
			userHost: null
		})]);

		const stats = {
			all, local
		};

		process.send(stats);
	}

	tick();

	setInterval(tick, interval);
});
