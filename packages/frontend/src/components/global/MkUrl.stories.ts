import { Meta, Story } from '@storybook/vue3';
import MkUrl from './MkUrl.vue';
const meta = {
	title: 'components/global/MkUrl',
	component: MkUrl,
};
export const Default = {
	components: {
		MkUrl,
	},
	template: '<MkUrl />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
