import { Meta, StoryObj } from '@storybook/vue3';
import object_storage from './object-storage.vue';
const meta = {
	title: 'pages/admin/object-storage',
	component: object_storage,
} satisfies Meta<typeof object_storage>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				object_storage,
			},
			props: Object.keys(argTypes),
			template: '<object_storage v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof object_storage>;
export default meta;
