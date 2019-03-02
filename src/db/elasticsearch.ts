import * as elasticsearch from 'elasticsearch';
import config from '../config';
import Logger from '../services/logger';

const esLogger = new Logger('es');

const index = {
	settings: {
		analysis: {
			normalizer: {
				lowercase_normalizer: {
					type: 'custom',
					filter: ['lowercase']
				}
			},
			analyzer: {
				bigram: {
					tokenizer: 'bigram_tokenizer'
				}
			},
			tokenizer: {
				bigram_tokenizer: {
					type: 'nGram',
					min_gram: 2,
					max_gram: 2
				}
			}
		}
	},
	mappings: {
		note: {
			properties: {
				text: {
					type: 'text',
					index: true,
					analyzer: 'bigram',
					normalizer: 'lowercase_normalizer'
				}
			}
		}
	}
};

// Init ElasticSearch connection
const client = config.elasticsearch ? new elasticsearch.Client({
	host: `${config.elasticsearch.host}:${config.elasticsearch.port}`
}) : null;

if (client) {
	// Send a HEAD request
	client.ping({
		// Ping usually has a 3000ms timeout
		requestTimeout: 30000
	}, error => {
		if (error) {
			esLogger.error('elasticsearch is down!');
		} else {
			esLogger.succ('elasticsearch is available!');
		}
	});

	client.indices.exists({
		index: 'misskey'
	}).then(exist => {
		if (exist) return;

		client.indices.create({
			index: 'misskey',
			body: index
		});
	});
}

export default client;
