/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import theme_manage from './theme.manage.vue';
const meta = {
	title: 'pages/settings/theme.manage',
	component: theme_manage,
} satisfies Meta<typeof theme_manage>;
export const Default = {
	render(args) {
		return {
			components: {
				theme_manage,
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
			template: '<theme_manage v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof theme_manage>;
export default meta;
