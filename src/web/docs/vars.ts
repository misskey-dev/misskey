import * as fs from 'fs';
import * as glob from 'glob';
import * as yaml from 'js-yaml';

import { fa } from '../../common/build/fa';
import config from '../../conf';
const constants = require('../../const.json');

export default function(): { [key: string]: any } {
	const vars = {} as { [key: string]: any };

	const endpoints = glob.sync('./src/web/docs/api/endpoints/**/*.yaml');
	vars['endpoints'] = endpoints.map(ep => {
		const _ep = yaml.safeLoad(fs.readFileSync(ep, 'utf-8'));
		return _ep.endpoint;
	});

	const entities = glob.sync('./src/web/docs/api/entities/**/*.yaml');
	vars['entities'] = entities.map(x => {
		const _x = yaml.safeLoad(fs.readFileSync(x, 'utf-8'));
		return _x.name;
	});

	const docs = glob.sync('./src/web/docs/**/*.*.pug');
	vars['docs'] = {};
	docs.forEach(x => {
		const [, name, lang] = x.match(/docs\/(.+?)\.(.+?)\.pug$/);
		if (vars['docs'][name] == null) {
			vars['docs'][name] = {
				name,
				title: {}
			};
		}
		vars['docs'][name]['title'][lang] = fs.readFileSync(x, 'utf-8').match(/^h1 (.+?)\r?\n/)[1];
	});

	vars['kebab'] = string => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();

	vars['config'] = config;

	vars['copyright'] = constants.copyright;

	vars['facss'] = fa.dom.css();

	return vars;
}
