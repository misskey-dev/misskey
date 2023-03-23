/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetSlideshow from './WidgetSlideshow.vue';
const meta = {
	title: 'widgets/WidgetSlideshow',
	component: WidgetSlideshow,
} satisfies Meta<typeof WidgetSlideshow>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetSlideshow,
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
			template: '<WidgetSlideshow v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetSlideshow>;
export default meta;
