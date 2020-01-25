import { Antenna } from '../models/entities/antenna';
import { Note } from '../models/entities/note';
import { User } from '../models/entities/user';
import { UserListJoinings } from '../models';

export async function checkHitAntenna(antenna: Antenna, note: Note, followers: User['id'][]): Promise<boolean> {
	if (note.visibility === 'specified') return false;

	if (note.visibility === 'followers') {
		if (!followers.includes(antenna.userId)) return false;
	}

	if (antenna.src === 'home') {
		if (!followers.includes(antenna.userId)) return false;
	} else if (antenna.src === 'list') {
		const listUsers = (await UserListJoinings.find({
			userListId: antenna.userListId!
		})).map(x => x.userId);

		if (!listUsers.includes(note.userId)) return false;
	}

	if (antenna.keywords.length > 0) {
		if (note.text == null) return false;
		const matched = antenna.keywords.some(keywords =>
			keywords.every(keyword =>
				note.text!.includes(keyword.toLowerCase())));
		
		if (!matched) return false;
	}

	if (antenna.withFile) {
		if (note.fileIds.length === 0) return false;
	}

	// TODO: eval expression

	return true;
}
