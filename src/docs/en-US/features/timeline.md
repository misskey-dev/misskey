# Timeline
タイムラインは、[ノート](./note)が時系列で表示される機能です。 タイムラインには以下で示す種類があり、種類によって表示されるノートも異なります。 なお、タイムラインの種類によってはサーバーにより無効になっている場合があります。

## Home
This is where you see posts from users you follow. Often abbreviated as HTL.

## Local
This is where you see all the posts from the local users, except those with "Home" visibility. Often abbreviated as LTL.

## Social
This is where you see the posts from users you follow AND all the posts from the local users, except those with "Home" visibility. Often abbreviated as STL.

## Global
This is where you see the posts from the local users and the remote users in federated servers, except those with "Home" visibility. Often abbreviated as GTL.

## Comparison
| Source                        |             |      | Timeline |        |        |
| ----------------------------- | ----------- | ---- | -------- | ------ | ------ |
| Users                         | Visiblility | Home | Local    | Social | Global |
| Local users you follow        | Publish     | ✔    | ✔        | ✔      | ✔      |
|                               | Home        | ✔    |          | ✔      |        |
|                               | Followers   | ✔    | ✔        | ✔      | ✔      |
| Remote users you follow       | Publish     | ✔    |          | ✔      | ✔      |
|                               | Home        | ✔    |          | ✔      |        |
|                               | Followers   | ✔    |          | ✔      | ✔      |
| Local users you don't follow  | Publish     |      | ✔        | ✔      | ✔      |
|                               | Home        |      |          |        |        |
|                               | Followers   |      |          |        |        |
| Remote users you don't follow | Publish     |      |          |        | ✔      |
|                               | Home        |      |          |        |        |
|                               | Followers   |      |          |        |        |
