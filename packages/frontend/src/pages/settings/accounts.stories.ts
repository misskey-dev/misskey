import { Meta, StoryObj } from '@storybook/vue3';
import accounts_ from './accounts.vue';
const meta = {
	title: 'pages/settings/accounts',
	component: accounts_,
} satisfies Meta<typeof accounts_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				accounts_,
			},
			props: Object.keys(argTypes),
			template: '<accounts_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof accounts_>;
export default meta;
