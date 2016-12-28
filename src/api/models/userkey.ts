const collection = global.db.collection('userkeys');

collection.createIndex('key');

export default collection;
