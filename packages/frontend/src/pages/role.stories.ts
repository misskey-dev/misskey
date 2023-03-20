import { Meta, StoryObj } from '@storybook/vue3';
import role from './role.vue';
const meta = {
	title: 'pages/role',
	component: role,
} satisfies Meta<typeof role>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				role,
			},
			props: Object.keys(argTypes),
			template: '<role v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof role>;
export default meta;
