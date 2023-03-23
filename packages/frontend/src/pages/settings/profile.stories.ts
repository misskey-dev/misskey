/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import profile_ from './profile.vue';
const meta = {
	title: 'pages/settings/profile',
	component: profile_,
} satisfies Meta<typeof profile_>;
export const Default = {
	render(args) {
		return {
			components: {
				profile_,
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
			template: '<profile_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof profile_>;
export default meta;
