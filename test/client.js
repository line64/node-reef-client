var ReefClient = require('../dist').ReefClient;
var SqsBrokerFacade = require('../dist').SqsBrokerFacade;
var async = require('async');

function runOneQuery(n, next) {

  console.log('submitting request '+n);

  echoClient
    .query('echo-data', {
      sleep: 5,
      data: "hello reefter"
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
  serviceDomain: 'service-mock',
  serviceLane: 'shared',
  clientDomain: 'stress-tester',
  clientLane: 'instance001'
});


var echoClient = new ReefClient(brokerFacade);

echoClient
  .setup()
  .then(function () {
    console.log('starting up client');
    return echoClient.start();
  })
  .then(function () {

    async.times(1000, runOneQuery);

  })
