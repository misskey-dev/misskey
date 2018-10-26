import { Context } from 'cafy';

type Defs = {
	params: { [key: string]: Context<any> }
};

export default function <T extends Defs>(defs: T, params: any): [{
	[P in keyof T['params']]: ReturnType<T['params'][P]['get']>[0];
}, Error] {
	const x: any = {};
	let err: Error = null;
	Object.keys(defs.params).some(k => {
		const [v, e] = defs.params[k].get(params[k]);
		if (e) {
			err = new Error(e.message);
			err.name = 'INVALID_PARAM';
			(err as any).param = k;
			return true;
		} else {
			if (v === undefined && defs.params[k].data.default) {
				x[k] = defs.params[k].data.default;
			} else {
				x[k] = v;
			}
			return false;
		}
	});
	return [x, err];
}
