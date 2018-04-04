import Post from '../../models/post';
import User, { IRemoteUser } from '../../models/user';
import context from '../../remote/activitypub/renderer/context';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderNote from '../../remote/activitypub/renderer/note';
import request from '../../remote/request';

export default async ({ data }) => {
	const promisedTo = User.findOne({ _id: data.toId }) as Promise<IRemoteUser>;
	const [from, post] = await Promise.all([
		User.findOne({ _id: data.fromId }),
		Post.findOne({ _id: data.postId })
	]);
	const note = await renderNote(from, post);
	const to = await promisedTo;
	const create = renderCreate(note);

	create['@context'] = context;

	return request(from, to.account.inbox, create);
};
