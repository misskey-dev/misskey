import autobind from 'autobind-decorator';
import Chart, { Obj } from '.';
import Instance from '../../models/instance';

/**
 * フェデレーションに関するチャート
 */
type FederationLog = {
	instance: {
		/**
		 * インスタンス数の合計
		 */
		total: number;

		/**
		 * 増加インスタンス数
		 */
		inc: number;

		/**
		 * 減少インスタンス数
		 */
		dec: number;
	};
};

class FederationChart extends Chart<FederationLog> {
	constructor() {
		super('federation');
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: FederationLog): Promise<FederationLog> {
		const [total] = init ? await Promise.all([
			Instance.count({})
		]) : [
			latest ? latest.instance.total : 0
		];

		return {
			instance: {
				total: total,
				inc: 0,
				dec: 0
			}
		};
	}

	@autobind
	public async update(isAdditional: boolean) {
		const update: Obj = {};

		update.total = isAdditional ? 1 : -1;
		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		await this.inc({
			instance: update
		});
	}
}

export default new FederationChart();
