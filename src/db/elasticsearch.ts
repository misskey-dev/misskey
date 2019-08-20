import * as elasticsearch from '@elastic/elasticsearch';
import config from '../config';

const index = {
	settings: {
		analysis: {
			analyzer: {
				ngram: {
					tokenizer: 'ngram'
				}
			}
		}
	},
	mappings: {
		properties: {
			text: {
				type: 'text',
				index: true,
				analyzer: 'ngram',
			},
			userId: {
				type: 'keyword',
				index: true,
			},
			userHost: {
				type: 'keyword',
				index: true,
			}
		}
	}
};

// Init ElasticSearch connection
const client = config.elasticsearch ? new elasticsearch.Client({
	node: `http://${config.elasticsearch.host}:${config.elasticsearch.port}`,
	pingTimeout: 30000
}) : null;

if (client) {
	client.indices.exists({
		index: config.elasticsearch.index || 'misskey_note',
	}).then(exist => {
		if (!exist.body) {
			client.indices.create({
				index: config.elasticsearch.index || 'misskey_note',
				body: index
			});
		}
	});
}

export default client;
