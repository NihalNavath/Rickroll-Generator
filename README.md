# Rickroll-Generator 
 The Rickroll-Generator is a tool that allows you to create disguised links to trick people into clicking on them, only to be taken to the music video of Rick Astley's "Never Gonna Give You Up".

## Features

- Create disguised links with rich previews to deceive potential victims
- Support for custom image
- Stats for your generated link that includes information like clicks
- Easily share links through social media, email, or messaging apps

## Links
- Tool https://news.rr.nihalnavath.com/
- faq https://news.rr.nihalnavath.com/faq
- Usage https://news.rr.nihalnavath.com/usage //coming soon

# Set up

Follow these steps to set up the Rickroll-Generator on your local machine.

1. Clone the repository: `git clone https://github.com/NihalNavath/Rickroll-Generator.git`
2. Create a `.env` file in the root directory, and fill in the following values:
Note: Port key is optional defaults to 3000 if not specified.

```
mongourl="<mongo database url>"
port=<port number>
```

3. Install dependencies: `npm install`
4. Set up the database: `npm run setup-db`
5. Start the server: `npm test`

If you have already compiled before and no new changes are made, you can simply run the server using `npm run start`

## Rate-limiting setup

The app uses [rate-limiter-flexible](https://www.npmjs.com/package/rate-limiter-flexible) module for setting up ratelimits.

If you plan on hosting, and you are behind a proxy/load balancer (usually the case with most hosting services, e.g. Nginx, Heroku, AWS ELB, Cloudflare, Akamai, Fastly, Firebase Hosting, Rackspace LB, Riverbed Stingray, etc.), the ip of the request might be of that of the proxy/load balancer making the ip effectively a global one which blocks all requests when the limit is reached. 

To solve this issue you need to correctly set the variable named `LEVEL` in `index.ts`. To find the value to be set create a test 
endpoint with the following code
```js
app.set('trust proxy', numberOfProxies)
app.get('/ip', (request, response) => response.send(request.ip))
```

Go to /ip and see if it matches your public ip address (search for "what is my public ip") then the ratelimiter should work properly, else
keep on incrementing the number until it does.

For more information about the `trust proxy` setting, take a look at the [official Express documentation](https://expressjs.com/en/guide/behind-proxies.html).


## Database CLI

The app provides some useful CLI commands using flags.

Note: Running the app without flags makes it enter setup mode, in which it tests if the database is configured properly and configures it if necessary.

The syntax is as follows:

1. Using node:
```
node built/db.js -flags
```

2. Using npm:
```
npm run setup-db -- -flags
```

__Flags__

`-get-count` - Returns the total number of rickroll victims.
`--reset-total-count` - Resets the total count of rickrolled victims to 0.


## Contribution

Contributions are welcome! To contribute to the project, follow these steps:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes and commit them to the new branch
4. Create a pull request.

We will review your pull request and will soon be part of the main branch if its ok.

## Reporting Bugs/Feature Requests

If you find any bugs or issues with the Rickroll-Generator or you want to request features, please open an issue on the Github repository. We appreciate your feedback and will do our best to fix any problems as quickly as possible.
