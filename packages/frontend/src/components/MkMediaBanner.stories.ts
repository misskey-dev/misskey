import { Meta, Story } from '@storybook/vue3';
import MkMediaBanner from './MkMediaBanner.vue';
const meta = {
	title: 'components/MkMediaBanner',
	component: MkMediaBanner,
};
export const Default = {
	components: {
		MkMediaBanner,
	},
	template: '<MkMediaBanner />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
