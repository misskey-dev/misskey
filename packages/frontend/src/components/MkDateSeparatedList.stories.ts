import { Meta, Story } from '@storybook/vue3';
import MkDateSeparatedList from './MkDateSeparatedList.vue';
const meta = {
	title: 'components/MkDateSeparatedList',
	component: MkDateSeparatedList,
};
export const Default = {
	components: {
		MkDateSeparatedList,
	},
	template: '<MkDateSeparatedList />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
