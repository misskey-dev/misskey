import { promises as dns } from 'dns';
import $ from 'cafy';
import define from '../../define';
import { Instances } from '../../../../models';
import { toPuny } from '@/misc/convert-host';

const resolver = new dns.Resolver();
resolver.setServers(['1.1.1.1']);

export const meta = {
	tags: ['federation'],

	requireCredential: false as const,

	params: {
		host: {
			validator: $.str
		}
	},
};

export default define(meta, async (ps, me) => {
	const instance = await Instances.findOneOrFail({ host: toPuny(ps.host) });

	const [
		resolved4,
		resolved6,
		resolvedCname,
		resolvedTxt,
	] = await Promise.all([
		resolver.resolve4(instance.host).catch(() => []),
		resolver.resolve6(instance.host).catch(() => []),
		resolver.resolveCname(instance.host).catch(() => []),
		resolver.resolveTxt(instance.host).catch(() => []),
	]);

	return {
		a: resolved4,
		aaaa: resolved6,
		cname: resolvedCname,
		txt: resolvedTxt,
	};
});
