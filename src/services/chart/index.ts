import FederationChart from './charts/federation';
import NotesChart from './charts/notes';
import UsersChart from './charts/users';
import NetworkChart from './charts/network';
import ActiveUsersChart from './charts/active-users';
import InstanceChart from './charts/instance';
import PerUserNotesChart from './charts/per-user-notes';
import DriveChart from './charts/drive';

export const federationChart = new FederationChart().init();
export const notesChart = new NotesChart().init();
export const usersChart = new UsersChart().init();
export const networkChart = new NetworkChart().init();
export const activeUsersChart = new ActiveUsersChart().init();
export const instanceChart = new InstanceChart().init();
export const perUserNotesChart = new PerUserNotesChart().init();
export const driveChart = new DriveChart().init();
