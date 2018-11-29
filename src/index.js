const { storage } = require('image-steam');
const BlobbyClient = require('blobby-client');

const StorageBase = storage.Base;

const globalConfigsCache = {};

module.exports = class StorageBlobbyClient extends StorageBase
{
  constructor(opts) {
    super(opts);

    this.argv = this.options.argv;
    this.options = this.options.options;

    if (!this.argv) {
      throw new Error('StorageBlobbyClient.argv is required');
    }

    if (!this.options) {
      throw new Error('StorageBlobbyClient.options is required');
    }

    if (!this.options.storageId) {
      throw new Error('StorageBlobbyClient.options.storageId is required');
    }

    this.getGlobalConfig(this.options);
  }

  async getGlobalConfig(opts) {
    const argv = Object.assign({}, this.argv, opts.argv);
    const cacheKey = JSON.stringify(argv);
    let cache = globalConfigsCache[cacheKey];
    if (!cache) { // cache promise
      globalConfigsCache[cacheKey] = cache = BlobbyClient.getConfigs(argv);
    }

    const configs = await cache;
    return { argv, config: configs[0] };
  }

  async getClient(opts) {
    const { argv, config } = await this.getGlobalConfig(opts);

    // no need to cache client instance as they are pretty much free. direct assignments only
    return new BlobbyClient(argv, config);
  }

  fetch(opts, originalPath, stepsHash, cb) {
    const imagePath = stepsHash ? `${originalPath}/${stepsHash}` : originalPath;
    this.getClient(opts).then(client => {
      const storage = client.getStorage(opts.options.storageId);
      client.getFile(storage, imagePath, { acl: 'public' }).then(([blobbyMeta, data]) => {
        const info = Object.assign(
          { path: encodeURIComponent(originalPath), stepsHash: stepsHash },
          blobbyMetaToISteam(blobbyMeta)
        );
  
        cb(null, info, data);
      }).catch(cb);
    }).catch(cb);
  }

  store(opts, originalPath, stepsHash, image, cb) {
    const imagePath = `${originalPath}/${stepsHash}`;
    this.getClient(opts).then(client => {
      const storage = client.getStorage(opts.options.storageId);

      image.info.stepsHash = stepsHash;
      const headers = {
        'content-type': image.contentType || 'application/octet-stream', // default to binary if unknown
        'x-amz-meta-isteam': JSON.stringify(image.info)
      };

      client.putFile(storage, imagePath, { buffer: image.buffer }, { headers }).then(headers => cb(null, headers)).catch(cb);
    }).catch(cb);
  }

  /* native touch is currently disabled due to loss of metadata during in-place replacement (CEPH only?)
  touch(opts, originalPath, stepsHash, image, cb) {
    const imagePath = `${originalPath}/${stepsHash}`;
    this.getClient(opts).then(client => {
      const storage = client.getStorage(opts.options.storageId);
      const headers = {
        'content-type': image.contentType || 'application/octet-stream', // default to binary if unknown
        'x-amz-meta-isteam': JSON.stringify(image.info), // meta data is lost on copy, so forward
        'x-amz-copy-source': `${imagePath}`, // perform copy
        'x-amz-metadata-directive': 'REPLACE' // required to permit replace during copy
      };

      client.putFile(storage, imagePath, { }, { headers }).then(headers => {
        return cb(null, headers)
      }).catch(cb);
    }).catch(cb);
  }
  */

 deleteCache(opts, originalPath, cb) {
    const imagePath = `${originalPath}`;
    this.getClient(opts).then(client => {
      const storage = client.getStorage(opts.options.storageId);
      client.deleteFiles(storage, imagePath, { }).then(cb).catch(cb);
    }).catch(cb);
  }
}

function blobbyMetaToISteam(meta) {
  let info = {};

  const infoHeader = meta.CustomHeaders && meta.CustomHeaders['amz-meta-isteam'];
  if (infoHeader) {
    info = JSON.parse(infoHeader);
  }

  if (meta.LastModified) {
    info.lastModified = meta.LastModified;
  }

  return info;
}

function isteamInfoToBlobby(info) {
  // TODO
}
