import { DriveFiles } from '../../models';
import { User } from '../../models/user';

export async function clacDriveUsageOf(user: User): Promise<number> {
	const [sum] = await DriveFiles
		.createQueryBuilder('file')
		.where('file.userId = :id', { id: user.id })
		.select('SUM(file.size)', 'sum')
		.getRawOne();

	return sum;
}
