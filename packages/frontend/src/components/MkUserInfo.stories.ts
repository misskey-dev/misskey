import { Meta, Story } from '@storybook/vue3';
import MkUserInfo from './MkUserInfo.vue';
const meta = {
	title: 'components/MkUserInfo',
	component: MkUserInfo,
};
export const Default = {
	components: {
		MkUserInfo,
	},
	template: '<MkUserInfo />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
