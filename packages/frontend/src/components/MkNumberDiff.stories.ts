import { Meta, Story } from '@storybook/vue3';
import MkNumberDiff from './MkNumberDiff.vue';
const meta = {
	title: 'components/MkNumberDiff',
	component: MkNumberDiff,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNumberDiff,
			},
			props: Object.keys(argTypes),
			template: '<MkNumberDiff v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
