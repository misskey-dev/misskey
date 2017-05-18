Setup with Docker :whale:
================================================================

Ensure that the working directory is the repository root directory.

To create misskey image:

`sudo docker build -t misskey ./docker`

To run misskey:

`sudo docker run --rm -i -t -p $PORT:80 -v $(pwd):/root/misskey -v $DBPATH:/data/db misskey`

where `$PORT` is the port used to access Misskey Web from host browser
and `$DBPATH` is the path of MongoDB database on the host for data persistence.

ex: `sudo docker run --rm -i -t -p 80:80 -v $(pwd):/root/misskey -v /data/db:/data/db misskey`

If you want to run misskey in production mode, add `--env NODE_ENV=production` like this:

`sudo docker run --rm -i -t -p 80:80 -v $(pwd):/root/misskey -v /data/db:/data/db --env NODE_ENV=production misskey`

Note that `$(pwd)` is the working directory.
