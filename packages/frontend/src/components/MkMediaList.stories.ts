import { Meta, Story } from '@storybook/vue3';
import MkMediaList from './MkMediaList.vue';
const meta = {
	title: 'components/MkMediaList',
	component: MkMediaList,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMediaList,
			},
			props: Object.keys(argTypes),
			template: '<MkMediaList v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
