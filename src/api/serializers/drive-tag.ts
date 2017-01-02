'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveTag from '../models/drive-tag';
import deepcopy = require('deepcopy');

/**
 * Serialize a drive tag
 *
 * @param {Object} tag
 * @return {Promise<Object>}
 */
const self = (
	tag: any
) => new Promise<Object>(async (resolve, reject) => {
	let _tag: any;

	// Populate the tag if 'tag' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(tag)) {
		_tag = await DriveTag.findOne({_id: tag});
	} else if (typeof tag === 'string') {
		_tag = await DriveTag.findOne({_id: new mongo.ObjectID(tag)});
	} else {
		_tag = deepcopy(tag);
	}

	// Rename _id to id
	_tag.id = _tag._id;
	delete _tag._id;

	resolve(_tag);
});

export default self;
