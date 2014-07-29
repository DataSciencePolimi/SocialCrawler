# Social Crawler
The applicaiton is composed of 2 parts the `Crawler` and the `Server`.



## Crawler
Is the actual crawler that iterates over the specified area. The crawler is social-network angostic, since it reqiores a `scan` function to be defined.

### Usage
```sh
node crawler.js <social> [-p <port:80>]
```
This will start the crawler and also an **HTTP** [Primus][primus] server on the specified port.

### Config
Each social network is configured in its own directory inside the `social` folder. The configuration of a social network is composed of 3 files:

* `config.json`: Contains the configuration of the social-network (api-key, database to use and so on...). The file **must** contain a `dbname` property with the name of the database to use **and** a `table` property containing the name of the collection.
* `scan.js`: This file exports the function that is called for each coordinate pair (latitude, longitude). To the function is passed an object containing the `lat` and `lng` values. The function can return a Promise.
* `schema.js`: This file contains the schema of the data retrieved from the social network. Not all fields must be defined, only `location` is somehow required.




## Crawler status (Server)
To see the status of the crawler in real time you have to start the `server` and see the live feed of data in the map.

### Usage
```sh
node server.js -s <socketUrl> [-p <port>] [-k googleApiKey]
```
This will start a server on the specified port and tries to connect to the [Primus][primus] socket identified by `socketUrl`.

### Config
The configuration are passed to the script via commang arguments:

* **port** [`-p`]: The port of the webserver, defaults to 80
* **socket** [`-s`]: The url of the crawler's primus socket, like `http://localhost:801`
* **key** [`-k`]: The Google Api Key for the map.




## Debug
Both uses the [debug][debug] module to log information, a tipical configuration would be:
```sh
DEBUG=scan,crawl,grid,schema node crawler.js <social> -p <port>
DEBUG=server node server.js -s <socketUrl>
```




[primus]: http://primus.io "Primus.io"
[debug]: https://github.com/visionmedia/debug "Debug"