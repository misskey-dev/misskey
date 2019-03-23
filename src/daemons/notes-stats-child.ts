import Note from '../models/entities/note';

const interval = 5000;

async function tick() {
	const [all, local] = await Promise.all([Note.count({
		createdAt: {
			$gte: new Date(Date.now() - interval)
		}
	}), Note.count({
		createdAt: {
			$gte: new Date(Date.now() - interval)
		},
		'_user.host': null
	})]);

	const stats = {
		all, local
	};

	process.send(stats);
}

tick();

setInterval(tick, interval);
