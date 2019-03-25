import { FederationChart } from './charts/federation';
import { NotesChart } from './charts/notes';

export const entities = [
	new FederationChart().entity,
	new NotesChart().entity
];
