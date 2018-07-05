import { Query } from 'cafy';

type Defs = {
	params: {[key: string]: {
		def: Query<any>;
		default?: any;
	}}
};

export default function <T extends Defs>(defs: T, params: any): [{
	[P in keyof T['params']]: ReturnType<T['params'][P]['def']['get']>[0];
}, Error] {
	const x: any = {};
	let err: Error = null;
	Object.keys(defs.params).some(k => {
		const [v, e] = defs.params[k].def.get(params[k]);
		if (e) {
			err = e;
			return true;
		} else {
			if (v === undefined && defs.params[k].default) {
				x[k] = defs.params[k].default;
			} else {
				x[k] = v;
			}
			return false;
		}
	});
	return [x, err];
}
