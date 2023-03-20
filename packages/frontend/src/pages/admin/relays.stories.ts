import { Meta, Story } from '@storybook/vue3';
import relays from './relays.vue';
const meta = {
	title: 'pages/admin/relays',
	component: relays,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				relays,
			},
			props: Object.keys(argTypes),
			template: '<relays v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
