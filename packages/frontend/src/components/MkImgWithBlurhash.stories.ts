import { Meta, Story } from '@storybook/vue3';
import MkImgWithBlurhash from './MkImgWithBlurhash.vue';
const meta = {
	title: 'components/MkImgWithBlurhash',
	component: MkImgWithBlurhash,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkImgWithBlurhash,
			},
			props: Object.keys(argTypes),
			template: '<MkImgWithBlurhash v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
