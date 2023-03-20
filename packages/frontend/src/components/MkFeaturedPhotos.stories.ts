import { Meta, Story } from '@storybook/vue3';
import MkFeaturedPhotos from './MkFeaturedPhotos.vue';
const meta = {
	title: 'components/MkFeaturedPhotos',
	component: MkFeaturedPhotos,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFeaturedPhotos,
			},
			props: Object.keys(argTypes),
			template: '<MkFeaturedPhotos v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
