import User from '../../../models/user';
import act from '../../../remote/activitypub/act';
import Resolver from '../../../remote/activitypub/resolver';

export default ({ data }, done) => User.findOne({ _id: data.actor })
	.then(actor => act(new Resolver(), actor, data.outbox))
	.then(Promise.all)
	.then(() => done(), done);
