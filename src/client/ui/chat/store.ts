import { markRaw } from 'vue';
import { Storage } from '../../pizzax';

export const store = markRaw(new Storage('chatUi', {
	widgets: {
		where: 'account',
		default: [] as {
			name: string;
			id: string;
			data: Record<string, any>;
		}[]
	},
}));
