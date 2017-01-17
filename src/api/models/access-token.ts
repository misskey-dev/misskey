import db from '../../db/mongodb';

const collection = db.collection('access_tokens');

collection.createIndex('token');
collection.createIndex('hash');

export default collection;
