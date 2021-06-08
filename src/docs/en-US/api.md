# Misskey API

Using the Misskey API you can develop Misskey clients, Webservices integrating with Misskey, Bots (later called "Applications" here) etc. The streaming API also exists, so it is also possible to create real-time applications.

To starting using the API, you first need to get an access token. This page will explain how to acquire an access token and then give basic API usage instructions.

## Obtaining an access token
Fundamentally, all API requests require an access token. The method of acquiring such an access token will vary depending on whether you yourself are sending API requests or requests are being sent through an application used by an end-user.

* In case of the former:  Move on to [ "Manually issuing an access token for your own account" ](#Manually-issuing-your-own-access-token)
* In case of the latter: Move on to [ "Requesting the application user to generate an access token" ](#Requesting-the-application-user-to-generate-an-access-token)

### Manually issuing your own access token
You can create an access token for your own account in Settings > API.

[Proceed to using the API.](#Using-the-API)

### Requesting the application user to generate an access token
To obtain an access token of the end user's account for your app, request permissions for it via the below process.

#### Step 1

Generate a UUID.We will call it the session ID from here on.

> The same session ID should not be used for multiple plugins, so please generate a new UUID for each access token.

#### Step 2

Open the URL `{_URL_}/miauth/{session}` in the user's browser.Replace the `{session}` part with your previously generated session ID.
> E.g.: `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

When opening this URL, you can set various settings via query prameters:
* `name` ... Application name
    * > E.g.: `MissDeck`
* `icon` ... Icon URL of the application
    * > E.g.: `https://missdeck.example.com/icon.png`
* `callback` ... URL to redirect to after authorization
    * > E.g.: `https://missdeck.example.com/callback`
    * In the redirect a `session` query parameter containing the session ID will be attached.
* `permission` ... Permissions requested by the application
    * > E.g.: `write:notes,write:following,read:drive`
    * List the requested permissions separated with a `,` character.
    * You can check all available permissions at the [API Reference](/api-doc)

#### Step 3
If you send a POST request to `{_URL_}/api/miauth/{session}/check` after the user has authorized the access token, the response will be a JSON object containing said token.

Properties included in the response:
* `token` ... Access token of the user
* `user` ... User data

[Proceed to using the API.](#Using-the-API)

## Using the API
**All API requests are POST, and all request and response data is formatted in JSON.There is no REST support.** The access token must be included in the request parameter called `i`.

* [API Reference](/api-doc)
* [Streaming API](./stream)
