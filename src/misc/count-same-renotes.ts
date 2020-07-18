import { Notes } from '../models';

export async function countSameRenotes(userId: string, renoteId: string, excludeNoteId: string | undefined): Promise<number> {
	// 指定したユーザーの指定したノートのリノートがいくつあるか数える
	const query = Notes.createQueryBuilder('note')
		.where('note.userId = :userId', { userId })
		.andWhere('note.renoteId = :renoteId', { renoteId });

	// 指定した投稿を除く
	if (excludeNoteId) {
		query.andWhere('note.id != :excludeNoteId', { excludeNoteId });
	}

	return await query.getCount();
}
