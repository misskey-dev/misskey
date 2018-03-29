import * as nopt from 'nopt';

export default (vector, index) => {
	const parsed = nopt({
		'only-processor': Boolean,
		'only-server': Boolean
	}, {
		p: ['--only-processor'],
		s: ['--only-server']
	}, vector, index);

	if (parsed['only-processor'] && parsed['only-server']) {
		throw 'only-processor option and only-server option cannot be set at the same time';
	}

	return parsed;
};
