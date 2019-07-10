import * as Sonic from "sonic-channel";
import config from "../config";
import {SearchClientBase} from "./SearchClientBase";

function bindAll(obj: Object<string, function>, self: Object) {
	for (const key in obj) {
		obj[key] = obj[key].bind(self);
	}
}

export class SonicDriver extends SearchClientBase {
	constructor(connectionArgs) {
		super();
		this._ingestClient = new Sonic.Ingest(connectionArgs).connect(
			bindAll(
				{
					connected() {
						// execute queue of queries
						this._runIngestQueue();
						this._ingestReady = true;
						this._emitReady();
					},
					disconnected() {
						this._ingestReady = false;
						this.emit("disconnected");
					},
					timeout() {},
					retrying() {},
					error(err) {
						this.emit("error", err);
					}
				},
				this
			)
		);

		this._searchClient = new Sonic.Search(connectionArgs).connect(
			bindAll(
				{
					connected() {
						// execute queue of queries
						this._runSearchQueue();
						this._searchReady = true;
						this._emitReady();
					},
					disconnected() {
						this._searchReady = false;
						this.emit("disconnected");
					},
					timeout() {},
					retrying() {},
					error(err) {
						this.emit("error", err);
					}
				},
				this
			)
		);
	}
	available = true;

	_ingestQueue = [];
	_searchQueue = [];
	_searchReady = false;
	_ingestReady = false;

	get ready() {
		return this._searchReady && this._ingestReady;
	}
	_emitReady() {
		if (this.ready) this.emit("ready");
	}
	async disconnect() {
		this.ready = false;
		return await this.client.close();
	}

	search(content, qualifiers = {}, limit) {
		function doSearch() {
			return this._searchClient.query(
				"misskey_note",
				pickQualifier(qualifiers),
				content,
				limit
			);
		}

		if (this._searchReady) {
			return doSearch();
		} else {
			return new Promise((resolve, reject) => {
				this._searchQueue.push(() => {
					doSearch()
						.then(resolve)
						.catch(reject);
				});
			});
		}
	}

	push(note) {
		function doIngest() {
			return Promise.all(
				Object.entries(this.QUALIFIERS).map(([qualifierId, qualifierValue]) =>
					this._ingestClient.push(
						"misskey_note",
						qualifierId + "-" + note.user[qualifierValue],

						note.id,
						note.text.toLowerCase()
					)
				)
			);
		}

		if (this._ingestReady) {
			return doIngest();
		} else {
			return new Promise((resolve, reject) => {
				this._ingestQueue.push(() => {
					doIngest()
						.then(resolve)
						.catch(reject);
				});
			});
		}
	}
}

function pickQualifier(qualifiers) {
	if (qualifiers.userId) return "userId-" + qualifiers.userId;
	else if (qualifiers.userHost) return "userHost-" + qualifiers.userHost;
	else return "default";
}

export default (config.sonic
	? new SonicDriver({
			host: config.sonic.host,
			port: config.sonic.port,
			auth: config.sonic.password
	  })
	: null);
