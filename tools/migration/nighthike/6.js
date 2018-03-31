db.posts.update({ mediaIds: null }, { $set: { mediaIds: [] } }, false, true);
