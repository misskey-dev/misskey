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
	const subject = finger.subject.toLowerCase().replace(/^acct:/, '');

	if (typeof verifier === 'string') {
		if (subject !== verifier) {
			throw new Error;
		}

		return finger;
	}

	if (typeof subject === 'string') {
		return resolve(subject, subject);
	}

	throw new Error;
}
