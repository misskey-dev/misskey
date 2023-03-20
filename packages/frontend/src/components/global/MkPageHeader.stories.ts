import { Meta, Story } from '@storybook/vue3';
import MkPageHeader from './MkPageHeader.vue';
const meta = {
	title: 'components/global/MkPageHeader',
	component: MkPageHeader,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPageHeader,
			},
			props: Object.keys(argTypes),
			template: '<MkPageHeader v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
