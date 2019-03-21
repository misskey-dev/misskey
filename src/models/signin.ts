import * as deepcopy from 'deepcopy';

const Signin = db.get<ISignin>('signin');
export default Signin;

export interface ISignin {
	id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	ip: string;
	headers: any;
	success: boolean;
}

/**
 * Pack a signin record for API response
 *
 * @param {any} record
 * @return {Promise<any>}
 */
export const pack = (
	record: any
) => new Promise<any>(async (resolve, reject) => {

	const _record = deepcopy(record);

	// Rename _id to id
	_record.id = _record.id;
	delete _record.id;

	resolve(_record);
});
