# Url Shortener

<p>
  <img src="https://img.shields.io/badge/Node.js-grey?logo=node.js">
  <img src="https://img.shields.io/badge/Express-grey?logo=express">
  <img src="https://img.shields.io/badge/MongoDB-grey?logo=mongodb">
</p>

A simple URL shortener written in Node.js using Express and MongoDB.<br>
Automatically redirects to saved "long" URLs, counts clicks per URL and has an API endpoint to add, edit, view and delete URLs via an external app.

> [!TIP]
> To get the most use out of this app, host it on a server so it can be accessed from any device. Ideally, you should use a short domain to make the app more practical.

<details>
  <summary><h3>Content</h3></summary>
  
- [Project Structure](#project-structure)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
  - [Parameters:](#parameters)
  - [Responses:](#responses)
  - [Registering New Short URL](#registering-new-short-url)
  - [Editing Existing URLs](#editing-existing-urls)
  - [Searching Existing Short URLs](#searching-existing-short-urls)
  - [Deleting Existing Short URLs](#deleting-existing-short-urls)
  - [Refreshing App's Database](#refreshing-apps-database)
- [Creating Short URLs Directly Inside MongoDB](#creating-short-urls-directly-inside-mongodb)
- [Webhook Logs](#webhook-logs)
- [Usage](#usage)

</details>
<hr>

# Project Structure

A quick overview of the main folders in this repository:

- **controllers/** – Route handler logic for API and redirect endpoints.
- **middleware/** – Express middleware for authentication, sanitization, and error handling.
- **public/** – Static assets (images, CSS, favicon).
- **routes/** – Express route definitions for API and redirect endpoints.
- **schemas/** – Mongoose schemas for MongoDB collections.
- **services/** – Application state, ensuring that the data is synchronized across the app.
- **utils/** – Helper functions and constants such as validation, formatting, and so on.
- **views/** – EJS templates for server-rendered pages.
- **index.js** - Main file.

# Installation

1. Open a MongoDB project if you don't have one.
2. Create a `.env` file and paste your MongoDB connection string inside. It should look like this:

```
DB=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/?retryWrites=true&w=majority
ACCESS_KEY=<key for your API, will be used by external apps to access your API>,
LOCAL=true
WEBHOOK_URL=<optional - needed to send logs via webhooks>
APP_NAME=<optional, used in webhooks>
APP_AVATAR=<optional, used in webhooks>
```

> [!IMPORTANT]
> The `LOCAL` parameter should only exist locally on your pc, don't include it in the hosted app.

> [!NOTE]
> You can read more on the app's webhook logs system under [Webhook logs](#webhook-logs).

3. Create a document in your MongoDB database according to the schema in `schemas/access.js`:

```json
{
  "urlLocal": "<local URL for the app, for example `http://localhost:8080/`>",
  "urlRemote": "<URL of the hosted app>",
  "admins": ["<array of admin user IDs or keys>"]
}
```

4. Replace `public/images/favicon.ico` with an icon of your choice.
5. Update the landing page [`views/home.ejs`](views/home.ejs) and the stylesheet [`public/css/style.css`](public/css/style.css) to your liking.
6. Run `npm i`.
7. Start `index.js`.

# API Endpoints

All API endpoints require an `Authorization` header with your API key:

```
Authorization: Bearer <key>
```

## Parameters:

- **Url:** The URL you'd like to shorten.
- **Page:** The URL extension your short URL will get.<br>
  For example, if your urlRemote=`https://myapp.com` and page=`example`,<br>
  the short URL you've registered will be at `https://myapp.com/example`.
- **Label:** A readable name for your short URL, will be used to query registered pairs.
- **RegisteredBy:** Name or ID of the user that registered the short URL.
- **ShowAll:** "true" or "false", an admin parameter used to display pairs from all users when querying.<br>
  (has no effect if user isn't an admin)

See each endpoint for required and optional parameters.

## Responses:

API responses are JSON objects containing a `status` field (`"success"` or `"error"`).

On success, a `data` field is included with an up-to-date data object.<br>
Example success:

```json
{
  "status": "success",
  "data": {
    "message": "Short URL has been registered.",
    "label": "Example",
    "shortUrl": "https://myapp.com/example",
    "orgUrl": "https://long-url-example.com",
    "registeredBy": "user123",
    "clicks": 0
  }
}
```

> [!NOTE]
> Search will return an array of objects instead (or an empty array).

On error, the response will include an `error` object containing a `message` field.<br>
Example error:

```json
{
  "status": "error",
  "error": { "message": "Missing `label` parameter." }
}
```

## Registering New Short URL

**POST** `/api/urlpairs`

**Body:**

```json
{
  "url": "https://long-url-example.com",
  "page": "example",
  "label": "Example",
  "registeredBy": "user123"
}
```

- All fields are required for registration.

## Editing Existing URLs

**PATCH** `/api/urlpairs/:page`

**Body:**

```json
{
  "newUrl": "https://new-long-url-site.com",
  "newPage": "newexample",
  "newLabel": "New Example",
  "registeredBy": "user123"
}
```

- `registeredBy` is required and must match the owner of the URL pair, or the user must be an admin.
- `newUrl`, `newPage`, and `newLabel` are optional parameters. Include only the fields you want to update.

## Searching Existing Short URLs

**GET** `/api/urlpairs?registeredBy=<user>&url=<url>&page=<page>&label=<label>&showAll=<true/false>`

- `registeredBy` is required.
- `url`, `page`, and `label` are optional filters.
- `showAll` is an optional filter, when queried by an admin would return pairs of all users instead of only the user's.<br>
  (has no effect if user isn't an admin)

Returns an array of matching URL pairs.

## Deleting Existing Short URLs

**DELETE** `/api/urlpairs/:page`

**Body:**

```json
{
  "label": "Example",
  "registeredBy": "user123"
}
```

- `registeredBy` is required and must match the owner of the URL pair or be an admin.
- `label` must match the URL pair you're deleting.

## Refreshing App's Database

**GET** `/api/admin/urlpairs/refresh?registeredBy=<user>`

> [!NOTE]
> Only admins can refresh the database.

> [!IMPORTANT]
> The database is refreshed automatically when accessed via the API. Use this action only if you updated the database manually.

# Creating Short URLs Directly Inside MongoDB

The documents need to match the schema in `schemas/urlPair.js`.

For example:

```json
{
  "url": "https://long-url-example.com",
  "page": "example",
  "label": "Example",
  "registeredBy": "user123",
  "clicks": 0
}
```

After adding documents directly to MongoDB, restart or refresh the app via the API.

# Webhook Logs

The app has a basic logs system that can optionally send events to a Discord channel (or any other service that accepts webhooks).<br>
If a `WEBHOOK_URL` is set, the app will attempt to send a webhook message using the optional `APP_NAME` and `APP_AVATAR` variables.<br>
Regardles of whether a webhook is set, all messages sent to the system are logged in the console.

Currently, the app only sends messages for online/offline and database events. You can add more logs using the function in `utils/webhooks.js`:

```js
const webhookLog = require("./utils/webhooks");
await webhookLog("New log message.");
```

The function allows a few overrides: app name and avatar (if you want to use something different from the default), and message content (if you want the webhook message to differ from what is printed in the console):

```js
const webhookLog = require("./utils/webhooks");
await webhookLog("New console log message.", "Other system", "https://myapp.com/other_system.png", "New webhook message");
```

> [!NOTE]
> The webhook's body structure and content formatting are set for my personal preferences, so feel free to adjust them.

# Usage

1. Register short URLs via an external app that uses the API, or by creating documents in your MongoDB database.
2. Use the short URLs and you will be redirected to their long counterparts automatically.
