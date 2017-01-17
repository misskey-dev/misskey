import db from '../../db/mongodb';

const collection = db.collection('apps');

collection.createIndex('name_id');
collection.createIndex('name_id_lower');
collection.createIndex('secret');

export default collection;
