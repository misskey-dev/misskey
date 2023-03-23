/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetPhotos from './WidgetPhotos.vue';
const meta = {
	title: 'widgets/WidgetPhotos',
	component: WidgetPhotos,
} satisfies Meta<typeof WidgetPhotos>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetPhotos,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<WidgetPhotos v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetPhotos>;
export default meta;
