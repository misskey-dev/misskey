import { MoreThanOrEqual, getRepository } from 'typeorm';
import { Note } from '../models/entities/note';
import { initDb } from '../db/postgre';
import { Stats } from './notes-stats';

const interval = 5000;

initDb().then(() => {
	const Notes = getRepository(Note);

	async function tick() {
		const [all, local] = await Promise.all([Notes.count({
			createdAt: MoreThanOrEqual(new Date(Date.now() - interval))
		}), Notes.count({
			createdAt: MoreThanOrEqual(new Date(Date.now() - interval)),
			userHost: null
		})]);

		const stats: Stats = {
			all, local
		};

		process.send!(stats);
	}

	tick();

	setInterval(tick, interval);
});
