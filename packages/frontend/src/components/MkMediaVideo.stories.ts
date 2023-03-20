import { Meta, Story } from '@storybook/vue3';
import MkMediaVideo from './MkMediaVideo.vue';
const meta = {
	title: 'components/MkMediaVideo',
	component: MkMediaVideo,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMediaVideo,
			},
			props: Object.keys(argTypes),
			template: '<MkMediaVideo v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
