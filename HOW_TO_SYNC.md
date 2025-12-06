#Do not forget to add the remote upstream
git remote add upstream git@github.com:misskey-dev/misskey.git


# Then fetch and merge, then resolve conflicts
git fetch --all
git merge upstream/master
