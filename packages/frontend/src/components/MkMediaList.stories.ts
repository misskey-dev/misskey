import { Meta, Story } from '@storybook/vue3';
import MkMediaList from './MkMediaList.vue';
const meta = {
	title: 'components/MkMediaList',
	component: MkMediaList,
};
export const Default = {
	components: {
		MkMediaList,
	},
	template: '<MkMediaList />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
