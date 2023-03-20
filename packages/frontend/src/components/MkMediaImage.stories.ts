import { Meta, Story } from '@storybook/vue3';
import MkMediaImage from './MkMediaImage.vue';
const meta = {
	title: 'components/MkMediaImage',
	component: MkMediaImage,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMediaImage,
			},
			props: Object.keys(argTypes),
			template: '<MkMediaImage v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
