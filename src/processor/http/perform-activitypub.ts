import User from '../../models/user';
import act from '../../common/remote/activitypub/act';

export default ({ data }, done) => User.findOne({ _id: data.actor })
	.then(actor => act(actor, data.outbox))
	.then(() => done(), done);
