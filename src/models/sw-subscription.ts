const SwSubscription = db.get<ISwSubscription>('swSubscriptions');
export default SwSubscription;

export interface ISwSubscription {
	_id: mongo.ObjectID;
	userId: mongo.ObjectID;
	endpoint: string;
	auth: string;
	publickey: string;
}
