var ReefClient = require('../dist').ReefClient;
var SqsBrokerFacade = require('../dist').SqsBrokerFacade;
var async = require('async');

function runOneQuery(n, next) {

  console.log('submitting request '+n);

  client
    .query('flight-availability', {
      originIata: 'EZE',
      destinyIata: 'MEX',
      departureDate: '2016-04-21',
      returnDate: '2016-04-25',
      paxs: '2;1-3,1-8',
      cabin: 'economy'
    })
    .then(function (data) {
      console.log('answer recived for '+n);
      next();
    })
    .catch(function (err) {
      console.log('error on query pipeline '+n);
    });

}

var brokerFacade = new SqsBrokerFacade({
  region: 'sa-east-1',
  accessKeyId: 'AKIAIZ4ONXIKT5EUBQDA',
  secretAccessKey: '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',
  serviceDomain: 'sabre-gateway',
  serviceLane: 'shared',
  clientDomain: 'content-api',
  clientLane: 'instance001'
});

var client = new ReefClient(brokerFacade);

client
  .setup()
  .then(function () {
    console.log('starting up client');
    return client.start();
  })
  .then(function () {

    async.times(10, runOneQuery);

  })
