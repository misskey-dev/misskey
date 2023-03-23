/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import universal_widgets from './universal.widgets.vue';
const meta = {
	title: 'ui/universal.widgets',
	component: universal_widgets,
} satisfies Meta<typeof universal_widgets>;
export const Default = {
	render(args) {
		return {
			components: {
				universal_widgets,
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
			template: '<universal_widgets v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof universal_widgets>;
export default meta;
