import FederationChart from './charts/federation';
import NotesChart from './charts/notes';
import UsersChart from './charts/users';
import NetworkChart from './charts/network';

export const federationChart = new FederationChart().init();
export const notesChart = new NotesChart().init();
export const usersChart = new UsersChart().init();
export const networkChart = new NetworkChart().init();
