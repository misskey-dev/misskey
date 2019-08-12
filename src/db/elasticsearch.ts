import * as elasticsearch from '@elastic/elasticsearch';
import config from '../config';
import {SearchClientBase} from './SearchClientBase';
import {Note} from '../models/entities/note';

const indexData = {
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
				analyzer: 'ngram'
			},
			userId: {
				type: 'keyword',
				index: true
			},
			userHost: {
				type: 'keyword',
				index: true
			}
		}
	}
};

class ElasticSearch extends SearchClientBase {
	public index = 'misskey_note';
	constructor(address: string, index?: string) {
		super();
		this.index = index || 'misskey_note';
		// Init ElasticSearch connection
		this._client = new elasticsearch.Client({
			node: address,
			pingTimeout: 30000
		});

		this._client.indices
			.exists({
				index: this.index
			})
			.then(exist => {
				if (!exist.body) {
					this._client.indices.create({
						index: this.index,
						body: indexData
					});
				}
			});
	}

	private _client: elasticsearch.Client;

	public available = true;

	public search(
		content: string,
		qualifiers: {userId?: string | null; userHost?: string | null} = {},
		limit?: number,
		offset?: number
	) {
		const queries: any[] = [
			{
				simple_query_string: {
					fields: ['text'],
					query: content.toLowerCase(),
					default_operator: 'and'
				}
			}
		];

		if (qualifiers.userId) {
			queries.push({
				term: {userId: qualifiers.userId}
			});
		} else if (qualifiers.userHost !== undefined) {
			if (qualifiers.userHost === null) {
				queries.push({
					bool: {
						must_not: {
							exists: {
								field: 'userHost'
							}
						}
					}
				});
			} else {
				queries.push({
					term: {
						userHost: qualifiers.userHost
					}
				});
			}
		}

		return this._client
			.search({
				index: this.index,
				body: {
					size: limit,
					from: offset,
					query: {
						bool: {
							must: queries
						}
					}
				}
			})
			.then(result => result.body.hits.hits.map((hit: any) => hit._id));
	}

	public push(note: Note) {
		return this._client.index({
			index: this.index,
			id: note.id.toString(),
			body: {
				text: String(note.text).toLowerCase(),
				userId: note.userId,
				userHost: note.userHost
			}
		});
	}
}

export default (config.elasticsearch
	? new ElasticSearch(
		`http://${config.elasticsearch.host}:${config.elasticsearch.port}`,
		config.elasticsearch.index
	)
	: null);
