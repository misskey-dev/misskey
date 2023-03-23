/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetProfile from './WidgetProfile.vue';
const meta = {
	title: 'widgets/WidgetProfile',
	component: WidgetProfile,
} satisfies Meta<typeof WidgetProfile>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetProfile,
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
			template: '<WidgetProfile v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetProfile>;
export default meta;
