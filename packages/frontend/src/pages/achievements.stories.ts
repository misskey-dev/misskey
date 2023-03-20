import { Meta, Story } from '@storybook/vue3';
import achievements from './achievements.vue';
const meta = {
	title: 'pages/achievements',
	component: achievements,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				achievements,
			},
			props: Object.keys(argTypes),
			template: '<achievements v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
