import { Meta, StoryObj } from '@storybook/vue3';
import achievements_ from './achievements.vue';
const meta = {
	title: 'pages/achievements',
	component: achievements_,
} satisfies Meta<typeof achievements_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				achievements_,
			},
			props: Object.keys(argTypes),
			template: '<achievements_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof achievements_>;
export default meta;
