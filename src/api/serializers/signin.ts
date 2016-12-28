'use strict';

/**
 * Module dependencies
 */
const deepcopy = require('deepcopy');

/**
 * Serialize a signin record
 *
 * @param {Object} record
 * @return {Promise<Object>}
 */
export default (
	record: any
) => new Promise<Object>(async (resolve, reject) => {

	const _record = deepcopy(record);

	// Rename _id to id
	_record.id = _record._id;
	delete _record._id;

	resolve(_record);
});
