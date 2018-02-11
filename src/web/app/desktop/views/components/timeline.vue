<template>
<div class="mk-timeline">
	<template each={ post, i in posts }>
		<mk-timeline-post post={ post }/>
		<p class="date" v-if="i != posts.length - 1 && post._date != posts[i + 1]._date"><span>%fa:angle-up%{ post._datetext }</span><span>%fa:angle-down%{ posts[i + 1]._datetext }</span></p>
	</template>
	<footer data-yield="footer">
		<yield from="footer"/>
	</footer>
</div>	
</template>

<script lang="typescript">
this.posts = [];

this.on('update', () => {
	this.posts.forEach(post => {
		const date = new Date(post.created_at).getDate();
		const month = new Date(post.created_at).getMonth() + 1;
		post._date = date;
		post._datetext = `${month}月 ${date}日`;
	});
});

this.setPosts = posts => {
	this.update({
		posts: posts
	});
};

this.prependPosts = posts => {
	posts.forEach(post => {
		this.posts.push(post);
		this.update();
	});
}

this.addPost = post => {
	this.posts.unshift(post);
	this.update();
};

this.tail = () => {
	return this.posts[this.posts.length - 1];
};

this.clear = () => {
	this.posts = [];
	this.update();
};

this.focus = () => {
	this.root.children[0].focus();
};

</script>

<style lang="stylus" scoped>
.mk-timeline

	> .date
		display block
		margin 0
		line-height 32px
		font-size 14px
		text-align center
		color #aaa
		background #fdfdfd
		border-bottom solid 1px #eaeaea

		span
			margin 0 16px

		[data-fa]
			margin-right 8px

	> footer
		padding 16px
		text-align center
		color #ccc
		border-top solid 1px #eaeaea
		border-bottom-left-radius 4px
		border-bottom-right-radius 4px

</style>
