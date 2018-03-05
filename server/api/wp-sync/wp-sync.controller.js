'use strict';

var _ = require('lodash'),
    http = require('https'),
    url  = require('url');

// Get list of wp-syncs
exports.index = function(req, res) {
  res.json([{'deployed': 'yes'}]);
};

exports.sync = function(request, result) {
	console.log('in')
	var consumer_key = request.query.consumer_key;
	var consumer_secret = request.query.consumer_secret;
	var captivity_results = request.body;
	captivity_results = captivity_results.root.product;

	var options = {
		host: 'www.captivity.co.za',
		path: '/wc-api/v3/products?filter[limit]=-1&consumer_key=' + consumer_key + '&consumer_secret=' + consumer_secret,
		headers: {
			"Content-Type": "application/json"
		},
		method: 'GET',
		rejectUnauthorized: false 
	};

	var callback = function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	    str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
	  	var woocommerce_results = JSON.parse(str).products;

	  	var products = [];
	  	var variations = [];


	  	//for (var i = woocommerce_results.length - 1; i >= 0; i--) {
	  	woocommerce_results.forEach(function(key, woocommerce) {
	  		if (woocommerce.variations) {
				//for (var n = captivity_results.length - 1; n >= 0; n--) {
				captivity_results.forEach(function(key, captivity) {
					woocommerce.variations.forEach(function(key, variation) {
						var woo_stock_quantity = +variation.stock_quantity;
						var captivity_stock_quantity = +captivity.stock_quantity;
						if (captivity.sku === variation.sku) 
						{
							if (woo_stock_quantity !== captivity_stock_quantity) {
								var variate = {
									id: variation.id,
									stock_quantity: captivity.stock_quantity
								}
								variations.push(variate )
							}
						}
					});
				});
	  		}
	  		if (variations.length) {
				var update = {
					'id': woocommerce.id,
					'variations': variations
				}
				products.push(update)
				variations = [];
			}
	  	});

	  	var results = {
	  		'products': products
	  	}
	    result.json(results);
	  });
	}

	http.request(options, callback).end();
}