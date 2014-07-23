# Social Crawler

Live feed at http://localhost:80/

## Usage
Start the crawler specifying the social to use

```sh
node crawler.js <social>
```

## Config
See `social` folder

## Debug
The app uses the DEBUG module so add a DEBUG environment variable to see debug info:

```sh
DEBUG=scan,crawl,grid,schema node crawler.js <social>
```