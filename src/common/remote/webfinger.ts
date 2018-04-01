const WebFinger = require('webfinger.js');

const webFinger = new WebFinger({ });

type ILink = {
  href: string;
  rel: string;
}

type IWebFinger = {
  links: Array<ILink>;
  subject: string;
}

export default (query, verifier): Promise<IWebFinger> => new Promise((res, rej) => webFinger.lookup(query, (error, result) => {
	if (error) {
		return rej(error);
	}

	if (result.object.subject.toLowerCase().replace(/^acct:/, '') !== verifier) {
		return rej('WebFinger verfification failed');
	}

	res(result.object);
}));
