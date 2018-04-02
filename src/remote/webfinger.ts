const WebFinger = require('webfinger.js');

const webFinger = new WebFinger({ });

type ILink = {
  href: string;
  rel: string;
};

type IWebFinger = {
  links: ILink[];
  subject: string;
};

export default async function resolve(query, verifier?: string): Promise<IWebFinger> {
	const finger = await new Promise((res, rej) => webFinger.lookup(query, (error, result) => {
		if (error) {
			return rej(error);
		}

		res(result.object);
	})) as IWebFinger;

	if (verifier) {
		if (finger.subject.toLowerCase().replace(/^acct:/, '') !== verifier) {
			throw 'WebFinger verfification failed';
		}

		return finger;
	}

	return resolve(finger.subject, finger.subject.toLowerCase());
}
