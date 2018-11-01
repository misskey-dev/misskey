import { IEndpointMeta } from './endpoints';

export default function <T extends IEndpointMeta>(defs: T, params: any): [{
	[P in keyof T['params']]: T['params'][P]['transform'] extends Function
		? ReturnType<T['params'][P]['transform']>
		: ReturnType<T['params'][P]['validator']['get']>[0];
}, Error] {
	const x: any = {};
	let err: Error = null;
	Object.entries(defs.params).some(([k, def]) => {
		const [v, e] = def.validator.get(params[k]);
		if (e) {
			err = new Error(e.message);
			err.name = 'INVALID_PARAM';
			(err as any).param = k;
			return true;
		} else {
			if (v === undefined && def.default) {
				x[k] = def.default;
			} else {
				x[k] = v;
			}
			if (def.transform) x[k] = def.transform(x[k]);
			return false;
		}
	});
	return [x, err];
}
