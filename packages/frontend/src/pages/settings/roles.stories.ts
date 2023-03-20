import { Meta, StoryObj } from '@storybook/vue3';
import roles from './roles.vue';
const meta = {
	title: 'pages/settings/roles',
	component: roles,
} satisfies Meta<typeof roles>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				roles,
			},
			props: Object.keys(argTypes),
			template: '<roles v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof roles>;
export default meta;
