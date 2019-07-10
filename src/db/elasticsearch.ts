import * as elasticsearch from "@elastic/elasticsearch";
import config from "../config";
import {SearchClientBase} from "./SearchClientBase";

const index = {
	settings: {
		analysis: {
			analyzer: {
				ngram: {
					tokenizer: "ngram"
				}
			}
		}
	},
	mappings: {
		properties: {
			text: {
				type: "text",
				index: true,
				analyzer: "ngram"
			},
			userId: {
				type: "keyword",
				index: true
			},
			userHost: {
				type: "keyword",
				index: true
			}
		}
	}
};

class ElasticSearch extends SearchClientBase {
	constructor(address) {
		// Init ElasticSearch connection
		this._client = new elasticsearch.Client({
			node: address,
			pingTimeout: 30000
		});

		this._client.indices
			.exists({
				index: "misskey_note"
			})
			.then(exist => {
				if (!exist.body) {
					this._client.indices.create({
						index: "misskey_note",
						body: index
					});
				}
			});
	}

	search(content, qualifiers = {}, limit, offset) {
		const queries = [
			{
				simple_query_string: {
					fields: ["text"],
					query: content.toLowerCase(),
					default_operator: "and"
				}
			}
		];

		if (qualifiers.userId) {
			queries.push({
				term: {userId: qualifiers.userId}
			});
		} else if (qualifiers.host !== undefined) {
			if (qualifiers.host === null) {
				queries.push({
					bool: {
						must_not: {
							exists: {
								field: "userHost"
							}
						}
					}
				});
			} else {
				queries.push({
					term: {
						userHost: qualifiers.host
					}
				});
			}
		}

		return this._client
			.search({
				index: "misskey_note",
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

	push(note) {
		const qualifierMap = {
			text: note.text.toLowerCase()
		};

		for (const qualifierId in this.QUALIFIERS) {
			qualifierMap[qualifierId] = note[this.QUALIFIERS[qualifierId]];
		}

		return this._client.index({
			index: "misskey_note",
			id: note.id.toString(),
			body: qualifierMap
		});
	}
}

export default (config.elasticsearch
	? new ElasticSearch(
			`http://${config.elasticsearch.host}:${config.elasticsearch.port}`
	  )
	: null);
