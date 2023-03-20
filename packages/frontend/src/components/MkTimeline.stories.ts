import { Meta, Story } from '@storybook/vue3';
import MkTimeline from './MkTimeline.vue';
const meta = {
	title: 'components/MkTimeline',
	component: MkTimeline,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTimeline,
			},
			props: Object.keys(argTypes),
			template: '<MkTimeline v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
