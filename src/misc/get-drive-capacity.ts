import { User } from '../models/entities/user';
import { Meta } from '../models/entities/meta';
export function getDriveCapacity(u: User, meta: Meta) {
	return !u.host
		? (u.isPremium ? meta.premiumDriveCapacityMb : meta.localDriveCapacityMb)
		: meta.remoteDriveCapacityMb;
}
