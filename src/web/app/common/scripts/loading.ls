NProgress = require 'NProgress'
NProgress.configure do
	trickle-speed: 500ms
	show-spinner: false

root = document.get-elements-by-tag-name \html .0

module.exports =
	start: ~>
		root.class-list.add \progress
		NProgress.start!
	done: ~>
		root.class-list.remove \progress
		NProgress.done!
	set: (val) ~>
		NProgress.set val
