import queue from '../../../../queue';

export default ({ $id }) => new Promise((resolve, reject) => {
	queue.create('http', { type: 'unfollow', id: $id }).save(error => {
		if (error) {
			reject(error);
		} else {
			resolve();
		}
	});
});
