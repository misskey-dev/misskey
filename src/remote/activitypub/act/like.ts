import Post from '../../../models/post';
import { IRemoteUser } from '../../../models/user';
import { ILike } from '../type';
import create from '../../../services/post/reaction/create';

export default async (actor: IRemoteUser, activity: ILike) => {
	const id = typeof activity.object == 'string' ? activity.object : activity.object.id;

	// Transform:
	// https://misskey.ex/@syuilo/xxxx to
	// xxxx
	const postId = id.split('/').pop();

	const post = await Post.findOne({ _id: postId });
	if (post === null) {
		throw new Error();
	}

	await create(actor, post, 'pudding');
};
