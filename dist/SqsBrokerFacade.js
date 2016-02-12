'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _sqsConsumer = require('sqs-consumer');

var _sqsConsumer2 = _interopRequireDefault(_sqsConsumer);

var _sqsProducer = require('sqs-producer');

var _sqsProducer2 = _interopRequireDefault(_sqsProducer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SqsBrokerFacade = (function () {
  function SqsBrokerFacade(options) {
    (0, _classCallCheck3.default)(this, SqsBrokerFacade);

    this._options = options;

    this._sqs = new _awsSdk2.default.SQS({
      region: options.region,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    });

    this._responseEmitter = new _events2.default();
  }

  (0, _createClass3.default)(SqsBrokerFacade, [{
    key: '_ensureQueue',
    value: function _ensureQueue(name) {
      var _this = this;

      return new _promise2.default(function (resolve, reject) {

        var params = {
          QueueName: name
        };

        _this._sqs.createQueue(params, function (err, data) {
          if (err) return reject(err);
          resolve(data.QueueUrl);
        });
      });
    }
  }, {
    key: '_setupRequestProducer',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(domain, lane) {
        var queueUrl, producer;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._ensureQueue(domain + '-' + lane + '-req');

              case 2:
                queueUrl = _context.sent;
                producer = _sqsProducer2.default.create({
                  sqs: this._sqs,
                  queueUrl: queueUrl
                });
                return _context.abrupt('return', producer);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      return function _setupRequestProducer(_x, _x2) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: '_processResponseMessage',
    value: function _processResponseMessage(message, done) {

      var response = {
        requestUid: message.MessageAttributes.requestUid.StringValue,
        payload: JSON.parse(message.Body),
        acknowledge: done
      };

      this._responseEmitter.emit(response.requestUid, response);
    }
  }, {
    key: '_setupResponseConsumer',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(domain, lane) {
        var _this2 = this;

        var queueUrl, consumer;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._ensureQueue(domain + '-' + lane + '-res');

              case 2:
                queueUrl = _context2.sent;
                consumer = _sqsConsumer2.default.create({
                  sqs: this._sqs,
                  queueUrl: queueUrl,
                  batchSize: 10,
                  messageAttributeNames: ['All'],
                  handleMessage: function handleMessage(message, done) {
                    _this2._processResponseMessage(message, done);
                  }
                });

                consumer.on('error', function (err) {
                  console.log(err.message);
                });

                return _context2.abrupt('return', consumer);

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      return function _setupResponseConsumer(_x3, _x4) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'setup',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._setupRequestProducer(this._options.serviceDomain, this._options.serviceLane);

              case 2:
                this._requestProducer = _context3.sent;
                _context3.next = 5;
                return this._setupResponseConsumer(this._options.clientDomain, this._options.clientLane);

              case 5:
                this._responseConsumer = _context3.sent;

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));
      return function setup() {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'start',
    value: function start() {

      this._responseConsumer.start();
    }
  }, {
    key: 'stop',
    value: function stop() {

      this._responseConsumer.stop();
    }
  }, {
    key: 'enqueueRequest',
    value: function enqueueRequest(request) {
      var _this3 = this;

      return new _promise2.default(function (resolve, reject) {

        var message = {
          id: request.uid,
          body: (0, _stringify2.default)(request.payload),
          messageAttributes: {
            reefDialect: { DataType: 'String', StringValue: request.reefDialect },
            requestUid: { DataType: 'String', StringValue: request.uid },
            queryType: { DataType: 'String', StringValue: request.queryType }
          }
        };

        _this3._requestProducer.send([message], function (err) {
          if (err) reject(err);
          resolve();
        });
      });
    }
  }, {
    key: 'expectResponse',
    value: function expectResponse(uid, timeout) {
      var _this4 = this;

      return new _promise2.default(function (resolve, reject) {

        _this4._responseEmitter.once(uid, function (data) {

          resolve(data);
        });

        setTimeout(function () {
          return reject(new Error('Response timeout'));
        }, timeout);
      });
    }
  }]);
  return SqsBrokerFacade;
})();

exports.default = SqsBrokerFacade;