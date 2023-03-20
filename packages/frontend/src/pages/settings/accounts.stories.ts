import { Meta, StoryObj } from '@storybook/vue3';
import accounts from './accounts.vue';
const meta = {
	title: 'pages/settings/accounts',
	component: accounts,
} satisfies Meta<typeof accounts>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				accounts,
			},
			props: Object.keys(argTypes),
			template: '<accounts v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof accounts>;
export default meta;
