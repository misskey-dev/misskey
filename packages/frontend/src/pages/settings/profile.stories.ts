import { Meta, StoryObj } from '@storybook/vue3';
import profile_ from './profile.vue';
const meta = {
	title: 'pages/settings/profile',
	component: profile_,
} satisfies Meta<typeof profile_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				profile_,
			},
			props: Object.keys(argTypes),
			template: '<profile_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof profile_>;
export default meta;
