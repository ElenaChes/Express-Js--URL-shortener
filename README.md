# Url Shortener.

A simple url shortener written in Node JS using Express and MongoDB.<br>
Description: automatically redirects to saved "long" urls and counts clicks per url, also has an API access point to add, edit, view or delete urls via an external app.

> To get the most use out of it - have the app running on a hosting service so it can be accessed from any device. Ideally you'd need a short domain as well for this app to make sense.

# Installation

1. Open a MongoDB project if you don't have one.
2. Create a `.env` file and paste your MongoDB connection string in it, the file should look like this:

```
DB=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/?retryWrites=true&w=majority
LOCAL=true
```

The `LOCAL` parameter should only exist locally on your pc, don't include it in the hosted app.

3. Create file in your MongoDB database according to the schema in `schemas/access.js`:

```
urlLocal: <local url for the app, for example `http://localhost:8080/`, will be used when app is running locally>
urlRemote: <url of the hosted app>
key: <key for your API, will need to be used by external apps to access your API>
```

4. Replace `public/images/favicon.ico` with an icon of your choice.
5. Run `npm i`
6. Start `index.js`.

# API actions

## Parameters:

- key - The API key mentioned previously.
- act - Can be one of the following: new, page, label, url, search, delete.
- u - The url you'd like to shorten.
- p - The url extension your short url will get. For example if your urlRemote=`https://myapp.com` and p=`page`, then the short url you've registered will be at `https://myapp.com/page`
- l - A readable name for your short url.
- rb - Name or ID (depending on platform) of the user that registered the short url.

Extra:

- The `n` before a parameter name in the editing options indicates "new".

## Responses:

App responds with 401 if request is missing `<key>`, if it was passed it will respond with JSON containing `status` and `response` fields.
The response can be a string indicating an error, or an object containing the fields:

- message
- label
- shortUrl
- orgUrl
- registeredBy
- clicks
  > Search will return an array of objects instead. (or an empty array)

## Registering new short url

### act=new

```
GET <urlRemote>api?key=<key>&act=new&u=<url>&p=<page>&l=<label>&rb=<user>
```

## Editing existing urls

To edit a short url the `rb` parameter has to be the same as the user that registered it. If `<key>` is passed instead, the app will treat the user as an admin and let them bypass this check.

### act=page

Update url extension of an existing short url.

```
GET <urlRemote>api?key=<key>&act=page&p=<page>&np=<npage>&rb=<user>
```

### act=label

Update label of an existing short url.

```
GET <urlRemote>api?key=<key>&act=label&p=<page>&nl=<nlabel>&rb=<user>
```

### act=url

Update url of an existing short url.

```
GET <urlRemote>api?key=<key>&act=url&p=<page>&nu=<nurl>&rb=<user>
```

## Searching existing short urls

Searching will by default only return urls registered by the user passed in `rb`, unless `<key>` was passed, then the app will treat the user as an admin and let them bypass this check.

### act=search

Required parameters:

```
GET <urlRemote>api?key=<key>&act=search&rb=<user>
```

Optional parameters:

```
u=<url>
p=<page>
l=<label>
```

> The app will return an array of objects whose fields included the search parameters passed in the request.

## Deleting existing short urls

To delete a short url the `rb` parameter has to be the same as the user that registered it. If `<key>` is passed instead, the app will treat the user as an admin and let them bypass this check.

### act=delete

```
GET <urlRemote>api?key=<key>&act=delete&p=<page>&l=<label>&rb=<user>
```

# Creating short urls directly inside MongoDB

The files will need to be according to the schema in `schemas/urlpair.js`.

```
url: <The url you'd like to shorten>
page: <The url extension your short url will get>
label: <A readable name for your short url>
registeredBy: <Name or ID of the user that registered the short url>
clicks: 0
```

# Usage

1. Register short urls via an external app that uses the API, or via creating files in your MongoDB database.
2. Use the short urls and you will be redirected to their long counterparts automatically.
