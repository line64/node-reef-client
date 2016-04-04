var ReefClient = require('../dist').ReefClient;
var SqsBrokerFacade = require('../dist').SqsBrokerFacade;
var async = require('async');

require('dotenv').load();

function runOneQuery(n, next) {

  console.log('submitting query request '+n);

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
      console.error(err);
    });

}

function runOneCommand(n, next) {

  console.log('submitting command request '+n);

  echoClient
    .execute('receive-data', {
      sleep: 5,
      data: "hello reefter"
    })
    .then(function (data) {
      console.log('receipt recived for '+n);
      next();
    })
    .catch(function (err) {
      console.log('error on command pipeline '+n);
      console.error(err);
    });

}

var brokerFacade = new SqsBrokerFacade({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  serviceDomain: 'service-mock',
  serviceLane: 'shared',
  clientDomain: 'client-test',
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

    async.times(20, runOneQuery);

  })
  .then(function () {

    async.times(20, runOneCommand);

  });
