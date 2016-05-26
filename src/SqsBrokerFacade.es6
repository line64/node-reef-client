import AWS from 'aws-sdk';
import Consumer from 'sqs-consumer';
import Producer from 'sqs-producer';
import EventeEmitter from 'events';

import ResponseStatus from './ResponseStatus';

export default class SqsBrokerFacade extends EventeEmitter {

  constructor(options) {

    super();

    this._options = options;

    this._sqs = new AWS.SQS({
      region: options.region,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    });

    this._listeners = {};

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

    let status = ResponseStatus.SUCCESS;
    try{
        status = message.MessageAttributes.status.StringValue;
    }
    catch(err){
        this.emit('warn', `Interacting with an old version of reef`);
    }

    this.emit('info', 'response message received');

    let listener = this._listeners[response.requestUid];
    delete this._listeners[response.requestUid];

    if(!listener) {
        done(new Error('No handler for the response'));
        this.emit('info', `Response for request uid ${response.requestUid} died silently`);
        return;
    }

    let promise = new Promise((resolve, reject) => {
        if( status == ResponseStatus.INTERNAL_ERROR ){
            done();
            let error = new Error(response.payload.message);
            error.serviceStack = response.payload.stack;
            return reject(error);
        }
        return resolve(response);
    });

    listener(promise);
  }


  async _setupResponseConsumer(domain, lane) {

    let queueUrl = await this._ensureQueue(`${domain}-${lane}-res`);

    let consumer = Consumer.create({
      sqs: this._sqs,
      queueUrl: queueUrl,
      batchSize: 10,
      messageAttributeNames: ['All'],
      handleMessage: (message, done) => this._processResponseMessage(message, done)
    });

    consumer.on('error', function (err) {
      bunyanLog.info(err.message);
    });

    return consumer;

  }

  async setup() {

    this._responseConsumer = await this._setupResponseConsumer(this._options.clientDomain, this._options.clientLane);

  }

  start() {

    this._responseConsumer.start();

  }

  stop() {

    this._responseConsumer.stop();

  }

  async enqueueRequest(request) {

    let message = {
      id: request.uid,
      body: JSON.stringify(request.payload),
      messageAttributes: this._buildSQSMessageAttributes(request)
    };

    let requestProducer = await this._setupRequestProducer(request.domain, request.lane);

    return new Promise((resolve, reject) => {

      requestProducer.send([message], function(err) {
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
              queryType: { DataType: 'String', StringValue: request.queryType },
              replyToDomain: { DataType: 'String', StringValue: this._options.clientDomain },
              replyToLane: { DataType: 'String', StringValue: this._options.clientLane }
          }
          break;

        case 'reef-v1-command':
          messageAttributes = {
              reefDialect: { DataType: 'String', StringValue: request.reefDialect },
              requestUid: { DataType: 'String', StringValue: request.uid },
              commandType: { DataType: 'String', StringValue: request.commandType },
              replyToDomain: { DataType: 'String', StringValue: this._options.clientDomain },
              replyToLane: { DataType: 'String', StringValue: this._options.clientLane }
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

      this._listeners[String(uid)] = resolve;

      setTimeout(() => {
          if (this._listeners[String(uid)]) reject(new Error('Response timeout'));
      }, timeout);

    });

  }

}
