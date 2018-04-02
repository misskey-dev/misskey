import * as elasticsearch from 'elasticsearch';
import config from '../config';

// Init ElasticSearch connection
const client = new elasticsearch.Client({
	host: `${config.elasticsearch.host}:${config.elasticsearch.port}`
});

// Send a HEAD request
client.ping({
	// Ping usually has a 3000ms timeout
	requestTimeout: Infinity,

	// Undocumented params are appended to the query string
	hello: 'elasticsearch!'
} as any, error => {
	if (error) {
		console.error('elasticsearch is down!');
	}
});

export default client;
