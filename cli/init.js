const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const inquirer = require('inquirer');
const chalk = require('chalk');

const configDirPath = `${__dirname}/../.config`;
const configPath = `${configDirPath}/default.yml`;

const form = [{
	type: 'input',
	name: 'maintainerName',
	message: 'Your name:'
}, {
	type: 'input',
	name: 'maintainerUrl',
	message: 'Your home page URL or your mailto URL:'
}, {
	type: 'input',
	name: 'url',
	message: 'URL you want to run Misskey:',
	validate: function(wannabeurl) {
		return wannabeurl.match('^http\(s?\)://') ? true :
		       'URL needs to start with http:// or https://';
	}
}, {
	type: 'input',
	name: 'port',
	message: 'Listen port (e.g. 443):'
}, {
	type: 'confirm',
	name: 'https',
	message: 'Use TLS?',
	default: false
}, {
	type: 'input',
	name: 'https_key',
	message: 'Path of tls key:',
	when: ctx => ctx.https
}, {
	type: 'input',
	name: 'https_cert',
	message: 'Path of tls cert:',
	when: ctx => ctx.https
}, {
	type: 'input',
	name: 'https_ca',
	message: 'Path of tls ca:',
	when: ctx => ctx.https
}, {
	type: 'input',
	name: 'mongo_host',
	message: 'MongoDB\'s host:',
	default: 'localhost'
}, {
	type: 'input',
	name: 'mongo_port',
	message: 'MongoDB\'s port:',
	default: '27017'
}, {
	type: 'input',
	name: 'mongo_db',
	message: 'MongoDB\'s db:',
	default: 'misskey'
}, {
	type: 'input',
	name: 'mongo_user',
	message: 'MongoDB\'s user:'
}, {
	type: 'password',
	name: 'mongo_pass',
	message: 'MongoDB\'s password:'
}, {
	type: 'input',
	name: 'redis_host',
	message: 'Redis\'s host:',
	default: 'localhost'
}, {
	type: 'input',
	name: 'redis_port',
	message: 'Redis\'s port:',
	default: '6379'
}, {
	type: 'password',
	name: 'redis_pass',
	message: 'Redis\'s password:'
}, {
	type: 'confirm',
	name: 'elasticsearch',
	message: 'Use Elasticsearch?',
	default: false
}, {
	type: 'input',
	name: 'es_host',
	message: 'Elasticsearch\'s host:',
	default: 'localhost',
	when: ctx => ctx.elasticsearch
}, {
	type: 'input',
	name: 'es_port',
	message: 'Elasticsearch\'s port:',
	default: '9200',
	when: ctx => ctx.elasticsearch
}, {
	type: 'password',
	name: 'es_pass',
	message: 'Elasticsearch\'s password:',
	when: ctx => ctx.elasticsearch
}, {
	type: 'input',
	name: 'recaptcha_site',
	message: 'reCAPTCHA\'s site key:'
}, {
	type: 'input',
	name: 'recaptcha_secret',
	message: 'reCAPTCHA\'s secret key:'
}];

inquirer.prompt(form).then(as => {
	// Mapping answers
	const conf = {
		maintainer: {
			name: as['maintainerName'],
			url: as['maintainerUrl']
		},
		url: as['url'],
		port: parseInt(as['port'], 10),
		mongodb: {
			host: as['mongo_host'],
			port: parseInt(as['mongo_port'], 10),
			db: as['mongo_db'],
			user: as['mongo_user'],
			pass: as['mongo_pass']
		},
		redis: {
			host: as['redis_host'],
			port: parseInt(as['redis_port'], 10),
			pass: as['redis_pass']
		},
		elasticsearch: {
			enable: as['elasticsearch'],
			host: as['es_host'] || null,
			port: parseInt(as['es_port'], 10) || null,
			pass: as['es_pass'] || null
		},
		recaptcha: {
			site_key: as['recaptcha_site'],
			secret_key: as['recaptcha_secret']
		}
	};

	if (as['https']) {
		conf.https = {
			key: as['https_key'] || null,
			cert: as['https_cert'] || null,
			ca: as['https_ca'] || null
		};
	}

	console.log(`Thanks. Writing the configuration to ${chalk.bold(path.resolve(configPath))}`);

	try {
		fs.writeFileSync(configPath, yaml.dump(conf));
		console.log(chalk.green('Well done.'));
	} catch (e) {
		console.error(e);
	}
});
