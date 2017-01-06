const collection = global.db.collection('access_tokens');

collection.createIndex('token');
collection.createIndex('hash');

export default collection;
