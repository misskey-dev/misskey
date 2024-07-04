import { instance } from '@/instance.js';
import { $i } from '@/account.js';

export const notesSearchAvailable = (($i == null && instance.policies.canSearchNotes) || ($i != null && $i.policies.canSearchNotes)) as boolean;
