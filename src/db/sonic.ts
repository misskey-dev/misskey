import * as Sonic from 'sonic-channel';
import config from '../config';
import {SearchClientBase} from './SearchClientBase';
import {Note} from '../models/entities/note';

function bindAll(obj: {[key: string]: (() => void) | ((err: Error) => void)}, self: SonicDriver) {
	for (const [key, value] of Object.entries(obj)) {
		obj[key] = value.bind(self);
	}

	return obj;
}

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
						this.emit('disconnected');
					},
					timeout() {},
					retrying() {},
					error(err: Error) {
						this.emit('error', err);
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
						this.emit('disconnected');
					},
					timeout() {},
					retrying() {},
					error(err: Error) {
						this.emit('error', err);
					}
				},
				this
			)
		);
	}

	get ready() {
		return this._searchReady && this._ingestReady;
	}
	public _emitReady() {
		if (this.ready) this.emit('ready');
	}
	public async disconnect() {
		return await this.client.close();
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
						([qualifierId, qualifierValue]) =>
							qualifierId + '-' + note[qualifierValue]
					)
					.concat(['default'])
					.map(bucket =>
						this._ingestClient.push(
							'misskey_note',
							bucket,

							note.id,
							note.text.toLowerCase()
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
