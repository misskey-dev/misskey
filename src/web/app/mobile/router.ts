/**
 * Mobile App Router
 */

import * as riot from 'riot';
import * as route from 'page';
import MiOS from '../common/mios';
let page = null;

export default (mios: MiOS) => {
	route('/',                           index);
	route('/selectdrive',                selectDrive);
	route('/i/notifications',            notifications);
	route('/i/messaging',                messaging);
	route('/i/messaging/:username',      messaging);
	route('/i/drive',                    drive);
	route('/i/drive/folder/:folder',     drive);
	route('/i/drive/file/:file',         drive);
	route('/i/settings',                 settings);
	route('/i/settings/profile',         settingsProfile);
	route('/i/settings/signin-history',  settingsSignin);
	route('/i/settings/twitter',         settingsTwitter);
	route('/i/settings/authorized-apps', settingsAuthorizedApps);
	route('/post/new',                   newPost);
	route('/post::post',                 post);
	route('/search',                     search);
	route('/:user',                      user.bind(null, 'overview'));
	route('/:user/graphs',               user.bind(null, 'graphs'));
	route('/:user/followers',            userFollowers);
	route('/:user/following',            userFollowing);
	route('/:user/:post',                post);
	route('*',                           notFound);

	function index() {
		mios.isSignedin ? home() : entrance();
	}

	function home() {
		mount(document.createElement('mk-home-page'));
	}

	function entrance() {
		mount(document.createElement('mk-entrance'));
	}

	function notifications() {
		mount(document.createElement('mk-notifications-page'));
	}

	function messaging(ctx) {
		if (ctx.params.username) {
			const el = document.createElement('mk-messaging-room-page');
			el.setAttribute('username', ctx.params.username);
			mount(el);
		} else {
			mount(document.createElement('mk-messaging-page'));
		}
	}

	function newPost() {
		mount(document.createElement('mk-new-post-page'));
	}

	function settings() {
		mount(document.createElement('mk-settings-page'));
	}

	function settingsProfile() {
		mount(document.createElement('mk-profile-setting-page'));
	}

	function settingsSignin() {
		mount(document.createElement('mk-signin-history-page'));
	}

	function settingsTwitter() {
		mount(document.createElement('mk-twitter-setting-page'));
	}

	function settingsAuthorizedApps() {
		mount(document.createElement('mk-authorized-apps-page'));
	}

	function search(ctx) {
		const el = document.createElement('mk-search-page');
		el.setAttribute('query', ctx.querystring.substr(2));
		mount(el);
	}

	function user(page, ctx) {
		const el = document.createElement('mk-user-page');
		el.setAttribute('user', ctx.params.user);
		el.setAttribute('page', page);
		mount(el);
	}

	function userFollowing(ctx) {
		const el = document.createElement('mk-user-following-page');
		el.setAttribute('user', ctx.params.user);
		mount(el);
	}

	function userFollowers(ctx) {
		const el = document.createElement('mk-user-followers-page');
		el.setAttribute('user', ctx.params.user);
		mount(el);
	}

	function post(ctx) {
		const el = document.createElement('mk-post-page');
		el.setAttribute('post', ctx.params.post);
		mount(el);
	}

	function drive(ctx) {
		const el = document.createElement('mk-drive-page');
		if (ctx.params.folder) el.setAttribute('folder', ctx.params.folder);
		if (ctx.params.file) el.setAttribute('file', ctx.params.file);
		mount(el);
	}

	function selectDrive() {
		mount(document.createElement('mk-selectdrive-page'));
	}

	function notFound() {
		mount(document.createElement('mk-not-found'));
	}

	(riot as any).mixin('page', {
		page: route
	});

	// EXEC
	(route as any)();
};

function mount(content) {
	document.documentElement.style.background = '#fff';
	if (page) page.unmount();
	const body = document.getElementById('app');
	page = riot.mount(body.appendChild(content))[0];
}
