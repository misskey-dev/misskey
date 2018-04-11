import Vue from 'vue';

Vue.filter('notePage', note => {
	return '/notes/' + note.id;
});
