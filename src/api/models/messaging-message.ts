import db from '../../db/mongodb';

export default db.get('messaging_messages') as any; // fuck type definition

export function isValidText(text: string): boolean {
	return text.length <= 1000 && text.trim() != '';
}

