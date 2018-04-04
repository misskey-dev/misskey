import deletePost from './post';

export default async ({ object }) => {
	switch (object.$ref) {
	case 'posts':
		return deletePost(object);
	}

	return null;
};
