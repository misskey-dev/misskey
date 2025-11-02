import locales from './index.js';

let valid = true;

function writeError(type, lang, tree, data) {
	process.stderr.write(JSON.stringify({ type, lang, tree, data }));
	process.stderr.write('\n');
	valid = false;
}

function verify(expected, actual, lang, trace) {
	for (let key in expected) {
		if (!Object.prototype.hasOwnProperty.call(actual, key)) {
			continue;
		}
		if (typeof expected[key] === 'object') {
			if (typeof actual[key] !== 'object') {
				writeError('mismatched_type', lang, trace ? `${trace}.${key}` : key, { expected: 'object', actual: typeof actual[key] });
				continue;
			}
			verify(expected[key], actual[key], lang, trace ? `${trace}.${key}` : key);
		} else if (typeof expected[key] === 'string') {
			switch (typeof actual[key]) {
				case 'object':
					writeError('mismatched_type', lang, trace ? `${trace}.${key}` : key, { expected: 'string', actual: 'object' });
					break;
				case 'undefined':
					continue;
				case 'string':
					const expectedParameters = new Set(expected[key].match(/\{[^}]+\}/g)?.map((s) => s.slice(1, -1)));
					const actualParameters = new Set(actual[key].match(/\{[^}]+\}/g)?.map((s) => s.slice(1, -1)));
					for (let parameter of expectedParameters) {
						if (!actualParameters.has(parameter)) {
							writeError('missing_parameter', lang, trace ? `${trace}.${key}` : key, { parameter });
						}
					}
			}
		}
	}
}

const { ['ja-JP']: original, ...verifiees } = locales;

for (let lang in verifiees) {
	if (!Object.prototype.hasOwnProperty.call(locales, lang)) {
		continue;
	}
	verify(original, verifiees[lang], lang);
}

if (!valid) {
	process.exit(1);
}
