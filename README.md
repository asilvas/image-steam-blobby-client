# image-steam-blobby-client
[Blobby](https://github.com/asilvas/blobby) client for [Image Steam](https://github.com/asilvas/node-image-steam).

**For caching only**


## Options

```ecmascript 6
import isteamBlobbyClient from 'image-steam-blobby-client';

const blobby = new isteamBlobbyClient({
  argv: {
    config: 'local',
    configBase: 'defaults',
    configDir: './config',
    configExts: ['.js', '.json', '.json5']
  },
  options: {
    storageId: 'local'
  }
});
```

| Param | Info |
| --- | --- |
| argv (***required***) | Arguments required by Blobby Client |
| argv.config | Name of config/environment |
| argv.configBase | Optional defaults file |
| argv.configDir | Directory of configurations |
| argv.configExts | Configuration extensions |
| options | Client options |
| options.storageId | Default storage key |


## Usage

Example:

```ecmascript 6
import isteam from 'image-steam';

const options = {
  storage: {
    app: {
      static: {
        driver: 'http',
        endpoint: 'https://some-endpoint.com'
      }
    },
    cache: {
      driverPath: 'image-steam-blobby-client',
      options: {
        argv: {
          config: 'local',
          configBase: 'defaults',
          configDir: './config',
          configExts: ['.js', '.json', '.json5']
        },
        options: {
          storageId: 'local'
        }
      }
    }
  }
}

http.createServer(new isteam.http.Connect(options).getHandler())
  .listen(13337, '127.0.0.1')
;
```
