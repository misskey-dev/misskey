import { Meta, Story } from '@storybook/vue3';
import relays from './relays.vue';
const meta = {
	title: 'pages/admin/relays',
	component: relays,
};
export const Default = {
	components: {
		relays,
	},
	template: '<relays />',
};
export default meta;
