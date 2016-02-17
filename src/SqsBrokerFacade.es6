import Emitter from 'events';
import AWS from 'aws-sdk';
import Consumer from 'sqs-consumer';
import Producer from 'sqs-producer';

export default class SqsBrokerFacade {

  constructor(options) {

    this._options = options;

    this._sqs = new AWS.SQS({
      region: options.region,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    });

    this._responseEmitter = new Emitter();

  }

  _ensureQueue(name) {

    return new Promise((resolve, reject) => {

      var params = {
        QueueName: name
      };

      this._sqs.createQueue(params, function(err, data) {
        if (err) return reject(err);
        resolve(data.QueueUrl);
      });

    });

  }

  async _setupRequestProducer(domain, lane) {

    let queueUrl = await this._ensureQueue(`${domain}-${lane}-req`);

    let producer = Producer.create({
      sqs: this._sqs,
      queueUrl: queueUrl
    });

    return producer;

  }

  _processResponseMessage(message, done) {

    let response = {
      requestUid: message.MessageAttributes.requestUid.StringValue,
      payload: JSON.parse(message.Body),
      acknowledge: done
    };

    this._responseEmitter.emit(response.requestUid, response);

  }

  async _setupResponseConsumer(domain, lane) {

    let queueUrl = await this._ensureQueue(`${domain}-${lane}-res`);

    let consumer = Consumer.create({
      sqs: this._sqs,
      queueUrl: queueUrl,
      batchSize: 10,
      messageAttributeNames: ['All'],
      handleMessage: (message, done) => { this._processResponseMessage(message, done); }
    });

    consumer.on('error', function (err) {
      console.log(err.message);
    });

    return consumer;

  }

  async setup() {

    this._requestProducer = await this._setupRequestProducer(this._options.serviceDomain, this._options.serviceLane);

    this._responseConsumer = await this._setupResponseConsumer(this._options.clientDomain, this._options.clientLane);

  }

  start() {

    this._responseConsumer.start();

  }

  stop() {

    this._responseConsumer.stop();

  }

  enqueueRequest(request) {

    return new Promise((resolve, reject) => {

      let message = {
        id: request.uid,
        body: JSON.stringify(request.payload),
        messageAttributes: this._buildSQSMessageAttributes(request)
      };

      this._requestProducer.send([message], function(err) {
        if (err) reject(err);
        resolve();
      });

    });

  }

  _buildSQSMessageAttributes (request) {
    let messageAttributes;
    switch (request.reefDialect) {
        case 'reef-v1-query':
          messageAttributes = {
              reefDialect: { DataType: 'String', StringValue: request.reefDialect },
              requestUid: { DataType: 'String', StringValue: request.uid },
              queryType: { DataType: 'String', StringValue: request.queryType }
          }
          break;

        case 'reef-v1-command':
          messageAttributes = {
              reefDialect: { DataType: 'String', StringValue: request.reefDialect },
              requestUid: { DataType: 'String', StringValue: request.uid },
              commandType: { DataType: 'String', StringValue: request.commandType }
          }
          break;

        default: 
          console.error("Unrecognized reefDialect");
          return;
    }
    return messageAttributes;
  }

  expectResponse(uid, timeout) {

    return new Promise((resolve, reject) => {

      this._responseEmitter.once(uid, (data) => {

        resolve(data);

      });

      setTimeout(() => reject(new Error('Response timeout')), timeout);

    });

  }

}
