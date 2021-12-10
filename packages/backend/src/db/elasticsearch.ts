import * as elasticsearch from '@elastic/elasticsearch';
import config from '@/config/index';

const index = {
	settings: {
		analysis: {
			analyzer: {
				ngram: {
					tokenizer: 'ngram',
				},
			},
		},
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
			},
		},
	},
};

// Init ElasticSearch connection
const client = config.elasticsearch ? new elasticsearch.Client({
	node: `${config.elasticsearch.ssl ? 'https://' : 'http://'}${config.elasticsearch.host}:${config.elasticsearch.port}`,
	auth: (config.elasticsearch.user && config.elasticsearch.pass) ? {
		username: config.elasticsearch.user,
		password: config.elasticsearch.pass,
	} : undefined,
	pingTimeout: 30000,
}) : null;

if (client) {
	client.indices.exists({
		index: config.elasticsearch.index || 'misskey_note',
	}).then(exist => {
		if (!exist.body) {
			client.indices.create({
				index: config.elasticsearch.index || 'misskey_note',
				body: index,
			});
		}
	});
}

export default client;
