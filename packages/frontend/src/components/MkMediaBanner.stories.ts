import { Meta, Story } from '@storybook/vue3';
import MkMediaBanner from './MkMediaBanner.vue';
const meta = {
	title: 'components/MkMediaBanner',
	component: MkMediaBanner,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMediaBanner,
			},
			props: Object.keys(argTypes),
			template: '<MkMediaBanner v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
