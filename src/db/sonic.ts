import * as Sonic from 'sonic-channel';
import config from '../config';
import {SearchClientBase} from './SearchClientBase';
import {Note} from '../models/entities/note';

export class SonicDriver extends SearchClientBase {
	public available = true;

	public _ingestQueue: (() => Promise<void>)[] = [];
	public _searchQueue: (() => Promise<void>)[] = [];
	public _searchReady = false;
	public _ingestReady = false;

	public _ingestClient: Sonic.Ingest;
	public _searchClient: Sonic.Search;

	constructor(connectionArgs: {
		host: string;
		port: number;
		auth: string | null;
	}) {
		super();
		// Bad!
		const self = this;
		this._ingestClient = new Sonic.Ingest(connectionArgs).connect({
			connected() {
				// execute queue of queries
				self._runIngestQueue();
				self._ingestReady = true;
				self._emitReady();
			},
			disconnected() {
				self._ingestReady = false;
				self.emit('disconnected');
			},
			timeout() {},
			retrying() {},
			error(err: Error) {
				self.emit('error', err);
			}
		});

		self._searchClient = new Sonic.Search(connectionArgs).connect({
			connected() {
				// execute queue of queries
				self._runSearchQueue();
				self._searchReady = true;
				self._emitReady();
			},
			disconnected() {
				self._searchReady = false;
				self.emit('disconnected');
			},
			timeout() {},
			retrying() {},
			error(err: Error) {
				self.emit('error', err);
			}
		});
	}

	get ready() {
		return this._searchReady && this._ingestReady;
	}
	public _emitReady() {
		if (this.ready) this.emit('ready');
	}
	public async disconnect() {
		return await Promise.all([
			this._searchClient.close(),
			this._ingestClient.close(),
		]);
	}

	public search(
		content: string,
		qualifiers: {userId?: string | null; userHost?: string | null} = {},
		limit: number = 20,
		offset?: number
	) {
		const doSearch = () =>
			this._searchClient.query(
				'misskey_note',
				pickQualifier(qualifiers),
				content,
				limit,
				offset
			);

		if (this._searchReady) {
			return doSearch();
		} else {
			return new Promise((resolve, reject) => {
				this._searchQueue.push(() =>
					doSearch()
						.then(resolve)
						.catch(reject)
				);
			});
		}
	}

	public push(note: Note) {
		const doIngest = () => {
			return Promise.all(
				Object.entries(this.QUALIFIERS)
					.map(
						([qualifierId, qualifierValue]: [string, string]) =>
							qualifierId + '-' + note[qualifierValue]
					)
					.concat(['default'])
					.map((bucket: string) =>
						this._ingestClient.push(
							'misskey_note',
							bucket,

							note.id,
							String(note.text).toLowerCase()
						)
					)
			);
		};

		if (this._ingestReady) {
			return doIngest();
		} else {
			return new Promise((resolve, reject) => {
				this._ingestQueue.push(() =>
					doIngest()
						.then(resolve)
						.catch(reject)
				);
			});
		}
	}

	public _runIngestQueue() {
		return Promise.all(this._ingestQueue.map(cb => cb()));
	}

	public _runSearchQueue() {
		return Promise.all(this._searchQueue.map(cb => cb()));
	}
}

function pickQualifier(qualifiers: {userId?: string | null; userHost?: string | null}) {
	if (qualifiers.userId) return 'userId-' + qualifiers.userId;
	else if (qualifiers.userHost) return 'userHost-' + qualifiers.userHost;
	else return 'default';
}

export default (config.sonic
	? new SonicDriver({
			host: config.sonic.host,
			port: config.sonic.port,
			auth: config.sonic.pass === null ? undefined : config.sonic.pass
	})
	: null);
