import Favorite from '../../../models/favorite';
import Notification from '../../../models/notification';
import PollVote from '../../../models/poll-vote';
import PostReaction from '../../../models/post-reaction';
import PostWatching from '../../../models/post-watching';
import Post from '../../../models/post';

export default async ({ data }) => Promise.all([
	Favorite.remove({ postId: data._id }),
	Notification.remove({ postId: data._id }),
	PollVote.remove({ postId: data._id }),
	PostReaction.remove({ postId: data._id }),
	PostWatching.remove({ postId: data._id }),
	Post.find({ repostId: data._id }).then(reposts => Promise.all([
		Notification.remove({
			postId: {
				$in: reposts.map(({ _id }) => _id)
			}
		}),
		Post.remove({ repostId: data._id })
	]))
]);
