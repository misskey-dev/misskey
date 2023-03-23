/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import theme_install from './theme.install.vue';
const meta = {
	title: 'pages/settings/theme.install',
	component: theme_install,
} satisfies Meta<typeof theme_install>;
export const Default = {
	render(args) {
		return {
			components: {
				theme_install,
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
			template: '<theme_install v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof theme_install>;
export default meta;
