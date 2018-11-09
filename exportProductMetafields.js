const async = require('async');
const request = require('request');
const jsonFile = require('jsonfile');
// UPDATE FILE NAME IF NEEDED
const newDataFile = './ProductMetafieldData.json';

// ENTER CREDENTIALS HERE
const apiKey = '';
const password = '';

let headerData;
let productData;
// ENTER STORE URL HERE
let url = 'https://' + apiKey + ':' + password + '@';

let productMetafieldData = {
  products: [],
}

function getProducts(lastId) {
  let productData = {};
  let lastProductId;
  let options = {
    url: url + '/admin/products.json?limit=10&fields=id,handle&since_id=' + lastId,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  request(options, function(err, response, body) {
    let jsonBody = JSON.parse(body);
    let products = jsonBody.products
    if (!err && products && products.length > 0) {
      async.eachSeries(products, function (product, nextEach) {
        console.log('Product ID: ' + product.id);
        console.log('Product Handle: ' + product.handle);

        productData.id = product.id;
        productData.handle = product.handle;
        lastProductId = product.id;

        // Throttling to avoid Shopify rate limits
        setTimeout(function () {
          getProductMetafields(product.id, function (err, metafields) {
            productData.metafields = metafields;
            productMetafieldData.products.push(productData);
            jsonFile.writeFile(newDataFile, productData, { flag: 'a' })
              .then(res => {
                console.log('Write complete');
                jsonFile.writeFile(newDataFile, ':::', { flag: 'a' })
                  .then(res => {
                    console.log('Write separator');
                  })
                  .catch(error => console.error(error))
              })
              .catch(error => console.error(error))
            nextEach(err);
          });
        }, 500);
      }, function (err) {
        if (err) {
          console.log('getProducts() Error: ', err);
        } else {
          getProducts(lastProductId);
        }
      });
    } else {
      if (err) {
        console.log('getProducts() Error: ', err);
      } else {
        console.log('Completed Export');
      }
    }
  });

}

function getProductMetafields(productId, cb) {
  let options = {
    url: url + '/admin/products/' + productId + '/metafields.json',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  request(options, function(err, response, body) {
    let jsonBody = JSON.parse(body);
    console.log(jsonBody.metafields);
    if (!err) {
      async.eachSeries(jsonBody.metafields, function(metafield, nextEach) {
        delete metafield.id;
        delete metafield.description;
        delete metafield.owner_id;
        delete metafield.created_at;
        delete metafield.updated_at;
        delete metafield.owner_resource;
        delete metafield.admin_graphql_api_id;
        nextEach();
      }, function (err) {
        cb(err, jsonBody.metafields);
      });
    } else {
      console.log('err', err);
      console.log('responseStatusCode', response.statusCode);
      cb(err);
    }
  });
}

getProducts(0);
