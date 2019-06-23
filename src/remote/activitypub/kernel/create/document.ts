import { IRemoteUser } from '../../../../models/entities/user';
import { IObject } from '../../type';
import { fetchNote } from '../../models/note';
import { createPureDocument } from '../../models/document';

export async function performCreateDocument(actor: IRemoteUser, document: IObject): Promise<void> {
	const exist = await fetchNote(document);
	if (exist == null) {
		await createPureDocument(document);
	}
}
