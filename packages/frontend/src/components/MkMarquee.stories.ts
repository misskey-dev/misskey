import { Meta, Story } from '@storybook/vue3';
import MkMarquee from './MkMarquee.vue';
const meta = {
	title: 'components/MkMarquee',
	component: MkMarquee,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMarquee,
			},
			props: Object.keys(argTypes),
			template: '<MkMarquee v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
