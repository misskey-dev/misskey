export function isInstanceMuted(note: any, muted_instances: Set<string>): boolean {
	if (muted_instances.has(note?.user?.host ?? '')) return true;
	if (muted_instances.has(note?.reply?.user?.host ?? '')) return true;
	if (muted_instances.has(note?.renote?.user?.host ?? '')) return true;

	return false;
}
