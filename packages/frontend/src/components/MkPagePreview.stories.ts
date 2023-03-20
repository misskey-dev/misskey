import { Meta, Story } from '@storybook/vue3';
import MkPagePreview from './MkPagePreview.vue';
const meta = {
	title: 'components/MkPagePreview',
	component: MkPagePreview,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPagePreview,
			},
			props: Object.keys(argTypes),
			template: '<MkPagePreview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
