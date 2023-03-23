/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import statusbar_statusbar from './statusbar.statusbar.vue';
const meta = {
	title: 'pages/settings/statusbar.statusbar',
	component: statusbar_statusbar,
} satisfies Meta<typeof statusbar_statusbar>;
export const Default = {
	render(args) {
		return {
			components: {
				statusbar_statusbar,
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
			template: '<statusbar_statusbar v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof statusbar_statusbar>;
export default meta;
