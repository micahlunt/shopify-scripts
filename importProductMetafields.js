const async = require('async');
const request = require('request');
const jsonFile = require('jsonfile');
// UPDATE FILE IF NEEDED
const importFile = './ProductMetafieldData.json';
// ENTER CREDENTIALS HERE
const apiKey = '';
const password = '';

let headerData;
let productData;
// INSERT STORE URL HERE
let url = 'https://' + apiKey + ':' + password + '@';

function readImportFile(cb) {
  jsonFile.readFile(importFile, function (err, obj) {
    cb(err, obj);
  });
}

function importProductMetafields() {
  async.waterfall([function (next) {
    let file = readImportFile(function (err, fileContents) {
      next(err, fileContents.file);
    });
  }, function (fileContents, next) {
    async.eachSeries(fileContents, function (fileItem, nextEach) {
      parseImportMetafields(fileItem, function (err) {
        nextEach(err);
      });
    }, function (err) {
      next(err);
    });
  }], function (err) {
    console.error('err', err);
    console.log('Import Complete');
  });
}

function parseImportMetafields(fileItem, cb) {
  async.waterfall([function (next) {
    setTimeout(function() {
      getShopifyProductByHandle(fileItem.handle, function (err, productId) {
        next(err, productId);
      });
    }, 500);
  }, function (productId, next) {
    setTimeout(function() {
      importMetafields(fileItem, productId, function (err) {
        next(err);
      });
    }, 500);
  }], function (err) {
    console.log('item done');
    cb();
  });
}

function getShopifyProductByHandle(productHandle, cb) {
  let options = {
    url: url + '/admin/products.json?fields=id&handle=' + productHandle,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  request(options, function(err, response, body) {
    let jsonBody = JSON.parse(body);
    let products = jsonBody.products
    if (!err && products && products.length === 1) {
      cb(null, products[0].id);
    } else {
      cb(err);
    }
  });
}

function importMetafields(fileItem, productId, cb) {
  async.eachSeries(fileItem.metafields, function (metafield, nextEach) {
    let metafieldImportObject = {
      metafield: metafield
    };
    console.log(metafieldImportObject);
    let options = {
      url: url + '/admin/products/' + productId + '/metafields.json',
      method: 'POST',
      body: JSON.stringify(metafieldImportObject),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    setTimeout(function() {
      request(options, function(err, response, body) {
        if (!err) {
          console.log(response.statusCode);
          console.log(body);
          nextEach();
        } else {
          console.log(err, response);
          nextEach(err);
        }
      });
    }, 500);

  }, function (err) {
    cb(err);
  });
}

setTimeout(function() {
  importProductMetafields();
}, 500);
