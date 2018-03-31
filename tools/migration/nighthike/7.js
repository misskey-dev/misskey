// for Node.js interpretation

const Message = require('../../../built/models/messaging-message').default;
const Post = require('../../../built/models/post').default;
const html = require('../../../built/common/text/html').default;
const parse = require('../../../built/common/text/parse').default;

Promise.all([Message, Post].map(async model => {
	const documents = await model.find();

	return Promise.all(documents.map(({ _id, text }) => model.update(_id, {
		$set: {
			textHtml: html(parse(text))
		}
	})));
})).catch(console.error).then(process.exit);
