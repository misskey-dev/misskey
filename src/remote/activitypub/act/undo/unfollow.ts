import { createHttp } from '../../../../queue';

export default ({ $id }) => new Promise((resolve, reject) => {
	createHttp({ type: 'unfollow', id: $id }).save(error => {
		if (error) {
			reject(error);
		} else {
			resolve();
		}
	});
});
