import Note from './models/note';

const interval = 5000;

setInterval(async () => {
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
}, interval);
