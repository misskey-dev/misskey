import { Meta, Story } from '@storybook/vue3';
import MkSparkle from './MkSparkle.vue';
const meta = {
	title: 'components/MkSparkle',
	component: MkSparkle,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSparkle,
			},
			props: Object.keys(argTypes),
			template: '<MkSparkle v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
