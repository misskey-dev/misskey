import { Meta, Story } from '@storybook/vue3';
import MkInfo from './MkInfo.vue';
const meta = {
	title: 'components/MkInfo',
	component: MkInfo,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkInfo,
			},
			props: Object.keys(argTypes),
			template: '<MkInfo v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
