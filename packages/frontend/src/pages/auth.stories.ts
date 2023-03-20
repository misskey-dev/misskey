import { Meta, StoryObj } from '@storybook/vue3';
import auth from './auth.vue';
const meta = {
	title: 'pages/auth',
	component: auth,
} satisfies Meta<typeof auth>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				auth,
			},
			props: Object.keys(argTypes),
			template: '<auth v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof auth>;
export default meta;
