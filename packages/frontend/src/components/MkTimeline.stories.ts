import { Meta, Story } from '@storybook/vue3';
import MkTimeline from './MkTimeline.vue';
const meta = {
	title: 'components/MkTimeline',
	component: MkTimeline,
};
export const Default = {
	components: {
		MkTimeline,
	},
	template: '<MkTimeline />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
