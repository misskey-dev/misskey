import Note from './models/note';

setInterval(async () => {
	const [all, local] = await Promise.all([Note.count({
		createdAt: {
			$gte: new Date(Date.now() - 3000)
		}
	}), Note.count({
		createdAt: {
			$gte: new Date(Date.now() - 3000)
		},
		'_user.host': null
	})]);

	const stats = {
		all, local
	};

	process.send(stats);
}, 3000);
