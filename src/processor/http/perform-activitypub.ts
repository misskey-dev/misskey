import User from '../../models/user';
import act from '../../remote/activitypub/act';

export default ({ data }) => User.findOne({ _id: data.actor })
	.then(actor => act(actor, data.outbox, false));
