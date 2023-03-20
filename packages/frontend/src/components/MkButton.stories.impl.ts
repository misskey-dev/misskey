import MkButton from './MkButton.vue';
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkButton,
			},
			props: Object.keys(argTypes),
			template: '<MkButton v-bind="$props">Text</MkButton>',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
