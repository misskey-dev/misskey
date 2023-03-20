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
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
