import { Meta, StoryObj } from '@storybook/vue3';
import abuses from './abuses.vue';
const meta = {
	title: 'pages/admin/abuses',
	component: abuses,
} satisfies Meta<typeof abuses>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				abuses,
			},
			props: Object.keys(argTypes),
			template: '<abuses v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof abuses>;
export default meta;
