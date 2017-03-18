/**
 * Module dependencies
 */
import deepcopy = require('deepcopy');

/**
 * Serialize a signin record
 *
 * @param {any} record
 * @return {Promise<any>}
 */
export default (
	record: any
) => new Promise<any>(async (resolve, reject) => {

	const _record = deepcopy(record);

	// Rename _id to id
	_record.id = _record._id;
	delete _record._id;

	resolve(_record);
});
