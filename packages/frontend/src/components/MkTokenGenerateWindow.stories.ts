import { Meta, Story } from '@storybook/vue3';
import MkTokenGenerateWindow from './MkTokenGenerateWindow.vue';
const meta = {
	title: 'components/MkTokenGenerateWindow',
	component: MkTokenGenerateWindow,
};
export const Default = {
	components: {
		MkTokenGenerateWindow,
	},
	template: '<MkTokenGenerateWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
