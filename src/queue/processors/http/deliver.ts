import * as kue from 'kue';

import Channel from '../../models/channel';
import Following from '../../models/following';
import ChannelWatching from '../../models/channel-watching';
import Post, { pack } from '../../models/post';
import User, { isLocalUser } from '../../models/user';
import stream, { publishChannelStream } from '../../publishers/stream';
import context from '../../remote/activitypub/renderer/context';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderNote from '../../remote/activitypub/renderer/note';
import request from '../../remote/request';

export default async (job: kue.Job, done): Promise<void> => {

	request(user, following.follower[0].account.inbox, create);
}
