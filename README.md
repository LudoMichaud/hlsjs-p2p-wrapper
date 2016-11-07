# hlsjs-p2p-wrapper

This module wraps an instance of [`hls.js`](https://github.com/dailymotion/hls.js) to bootstrap it with [the Streamroot P2P module](http://streamroot.io).

It provides a **bundle** that extends the [`hls.js`](https://github.com/dailymotion/hls.js) constructor to create a fully configured player which will use the Streamroot P2P module, giving you the exact same API.
You can integrate this bundle with minimal changes in your application (you only need to add an additional argument to the [`hls.js`](https://github.com/dailymotion/hls.js) constructor). **The bundled version of [`hls.js`](https://github.com/dailymotion/hls.js) is [`v0.5.51`](https://github.com/dailymotion/hls.js/releases/tag/v0.5.51)**.

It also provides a **wrapper** that allows you to create/configure a player with a specific version of [`hls.js`](https://github.com/dailymotion/hls.js).  
Supported versions of [`hls.js`](https://github.com/dailymotion/hls.js): from [`v0.5.46`](https://github.com/dailymotion/hls.js/releases/tag/v0.5.46) to [`v0.6.1`](https://github.com/dailymotion/hls.js/releases/tag/v0.6.1).

### Install via npm

You can install the artifacts distributed as NPM modules:

For the wrapper with [`hls.js`](https://github.com/dailymotion/hls.js) included:

```
npm install streamroot-hlsjs-p2p-bundle
```

For the wrapper without [`hls.js`](https://github.com/dailymotion/hls.js):

```
npm install streamroot-hlsjs-p2p-wrapper
```

In your application import/require the package you want to use as in the example like

```javascript
import StreamrootHlsjsP2PBundle from 'streamroot-hlsjs-p2p-bundle';
```

or

```javascript
import StreamrootHlsjsP2PWrapper from 'streamroot-hlsjs-p2p-wrapper';
```

### Build

#### Pre-requisites

First of all, make sure you are using a Node.js version >= 6.0.0

Since the installation uses a Ruby script, you need Ruby to be installed on your machine. On most Linux distros and on macOS, it's installed by default, but for Windows you need to install it [manually](https://www.ruby-lang.org/en/).

Finally, one of the install steps assumes the presence of `wget` on your system. Again this is most likely installed on all Unix based systems. If you have a Mac, you could use [Homebrew](https://brew.sh/) and then run `brew install wget`.

Grunt is used for running build tasks, so make sure that you have `grunt-cli` installed in your global node binaries otherwise install it like this:
```
sudo npm install -g grunt-cli
```

#### Clone this repo

```
git clone https://github.com/streamroot/hlsjs-p2p-wrapper.git
```

#### Install library dependencies

```
npm install
```

#### Build bundle

Run this task to build it:
```
grunt browserify:bundle
```

Now you can include `dist/bundle/hlsjs-p2p-bundle.js` in your application.

To build and compile-watch development/debug version use:

```
grunt browserify:bundle_dev
```

#### Build wrapper

Run this task to build it:
```
grunt browserify:wrapper
```

Now you can include `dist/wrapper/hlsjs-p2p-wrapper.js` in your application.

To build and compile-watch development/debug version use:

```
grunt browserify:wrapper_dev
```

### Tests

For running unit tests (in node.js), use

```
npm test
```

For integration tests (Running in PhantomJS/Chrome browsers via Karma through Mocha plugin), use

```
npm run karma
```

IMPORTANT: Set `export NODE_ENV=development` in your shell to make sure Karma will use all your local browser capabilities when in dev mode.

For integration tests in dev mode (Mocha suite running in your favorite browser, better for debugging):

1. Start dev server:

```
npm start
```

2. Start compile&watch browserify process (in another shell):

```
grunt browserify:test_dev
```

3. Go to http://localhost:8080/test/html/

### Example

#### Bundle

Include the bundle build in your app.

```html
<head>
    <!-- path to hlsjs-p2p-bundle build -->
    <script src="hlsjs-p2p-bundle.js"></script>
</head>
```

Create `hls.js` instance passing `hlsjsConfig` and `p2pConfig` as constructor params.

```javascript
var hlsjsConfig = {
    debug: true
};

var p2pConfig = {
    streamrootKey: YOUR_STREAMROOT_KEY_HERE,
    debug: true
};

// Hls constructor is overriden by included bundle
var hls = new Hls(hlsjsConfig, p2pConfig);
// Use `hls` just like your usual hls.js ...
```

#### Wrapper

Include the wrapper build and [`hls.js`](https://github.com/dailymotion/hls.js) build in your app.

```html
<head>
    <!-- path to hlsjs-p2p-wrapper build -->
    <script src="hlsjs-p2p-wrapper.js"></script>

    <!-- hls.js build of your choice -->
    <script src="hls.js"></script>
</head>
```

##### Without async loading

Create [`hls.js`](https://github.com/dailymotion/hls.js) wrapper instance passing reference to `Hls` as constructor param. Create [`hls.js`](https://github.com/dailymotion/hls.js) instance using wrapper's `createPlayer` methods passing `hlsjsConfig` and `p2pConfig` as params.

```javascript
var hlsjsConfig = {};

var p2pConfig = {
    streamrootKey: YOUR_STREAMROOT_KEY_HERE
};

var wrapper = new HlsjsP2PWrapper(Hls);
var hls = wrapper.createPlayer(hlsjsConfig, p2pConfig);
// Use `hls` just like your usual hls.js…
```

##### With async loading
```javascript
var hlsjsConfig = {
    maxBufferSize: 0,		// Highly recommended setting
    maxBufferLength: 30		// Highly recommended setting
};

var hls = new Hls(hlsjsConfig);

var wrapper = new HlsjsP2PWrapper(Hls);

// This part can be executed later
hls.config.fLoader = wrapper.P2PLoader;
hls.config.maxBufferSize = 0;
hls.config.maxBufferLength = 30;

var p2pConfig = {
    streamrootKey: YOUR_STREAMROOT_KEY_HERE
};

if (hls.url) {
    wrapper.createSRModule(p2pConfig, hls, Hls.Events);
} else {
    hls.on(Hls.Events.MANIFEST_LOADING, function() {
        wrapper.createSRModule(p2pConfig, hls, Hls.Events);
    });
}
```


To see full sample code and extended possibilities of how to use this module, take a look at the code in the `example` directory.

### Configuration

Specify your `streamrootKey` in the `p2pConfig` object. If you don't have it, go to [Streamroot's dashboard](http://dashboard.streamroot.io/) and sign up. It's free. You can check other `p2pConfig` options in the [documentation](https://streamroot.readme.io/docs/p2p-config) and our recommendations about [`hls.js`](https://github.com/dailymotion/hls.js) configuration [here](https://streamroot.readme.io/docs/hls-config).

### Statistics

#### Bundle

No statistics available yet.

#### Wrapper

A `stats` object is available on a `HlsjsP2PWrapper` instance and contains the following properties:

- `cdn`: cdn downloaded (cumulated bytes).
- `p2p`: p2p offloaded from cdn (cumulated bytes).
- `upload`: p2p uploaded (cumulated bytes).
- `peers`: real time connected peers count.

### Run demos

To build and run the shipped [`hls.js`](https://github.com/dailymotion/hls.js) and Streamroot demos run:

```
grunt demo
```

This will start a server.

Go to <http://localhost:8080/example> for the Streamroot demo.

Go to <http://localhost:8080/demo> for the [`hls.js`](https://github.com/dailymotion/hls.js) demo.

To see some p2p traffic open several browser tabs/windows playing the same manifest (so there will be peers to exchange p2p traffic).

### API docs

The public API documentation is generated from the code.

After clonig the repo run:

```
grunt docs
```

### Player integration

The module is integrated in the following players:

* [Video.js 5](https://github.com/videojs/video.js/) through [videojs5-hlsjs-p2p-source-handler](https://github.com/streamroot/videojs5-hlsjs-p2p-source-handler)
