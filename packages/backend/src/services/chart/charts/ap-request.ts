import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { name, schema } from './entities/ap-request';

/**
 * Chart about ActivityPub requests
 */
// eslint-disable-next-line import/no-default-export
export default class ApRequestChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	public async deliverSucc(): Promise<void> {
		await this.commit({
			'deliverSucceeded': 1,
		});
	}

	@autobind
	public async deliverFail(): Promise<void> {
		await this.commit({
			'deliverFailed': 1,
		});
	}

	@autobind
	public async inbox(): Promise<void> {
		await this.commit({
			'inboxReceived': 1,
		});
	}
}
