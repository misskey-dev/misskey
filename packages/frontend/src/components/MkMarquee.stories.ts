import { Meta, Story } from '@storybook/vue3';
import MkMarquee from './MkMarquee.vue';
const meta = {
	title: 'components/MkMarquee',
	component: MkMarquee,
};
export const Default = {
	components: {
		MkMarquee,
	},
	template: '<MkMarquee />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
