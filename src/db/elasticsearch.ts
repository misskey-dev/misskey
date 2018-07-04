import * as elasticsearch from 'elasticsearch';
import config from '../config';

// Init ElasticSearch connection
const client = new elasticsearch.Client({
	host: `${config.elasticsearch.host}:${config.elasticsearch.port}`
});

// Send a HEAD request
client.ping({
	// Ping usually has a 3000ms timeout
	requestTimeout: 30000
}, error => {
	if (error) {
		console.error('elasticsearch is down!');
	} else {
		console.log('elasticsearch is available!');
	}
});

client.indices.create({
	index: 'misskey',
	body: {
		settings: {
			analysis: {
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
						index: 'analyzed',
						analyzer: 'bigram'
					}
				}
			}
		}
	}
});

export default client;
