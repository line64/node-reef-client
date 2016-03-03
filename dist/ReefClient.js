'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _uid = require('uid');

var _uid2 = _interopRequireDefault(_uid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ReefClient = (function () {
  function ReefClient(brokerFacade) {
    (0, _classCallCheck3.default)(this, ReefClient);

    this._brokerFacade = brokerFacade;
  }

  (0, _createClass3.default)(ReefClient, [{
    key: 'setup',
    value: function setup() {

      return this._brokerFacade.setup();
    }
  }, {
    key: 'start',
    value: function start() {

      this._brokerFacade.start();
    }
  }, {
    key: 'stop',
    value: function stop() {

      this._brokerFacade.stop();
    }
  }, {
    key: 'query',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(type, params) {
        var requestUid, request, responsePromise, response;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                requestUid = (0, _uid2.default)();
                request = {
                  reefDialect: 'reef-v1-query',
                  queryType: type,
                  payload: params,
                  uid: requestUid
                };
                responsePromise = this._brokerFacade.expectResponse(requestUid, 30000);
                _context.next = 5;
                return this._brokerFacade.enqueueRequest(request);

              case 5:
                _context.next = 7;
                return responsePromise;

              case 7:
                response = _context.sent;

                response.acknowledge();

                return _context.abrupt('return', response.payload);

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      return function query(_x, _x2) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'execute',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(type, params) {
        var requestUid, request, response;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                requestUid = (0, _uid2.default)();
                request = {
                  reefDialect: 'reef-v1-command',
                  commandType: type,
                  payload: params,
                  uid: requestUid
                };
                _context2.next = 4;
                return this._brokerFacade.enqueueRequest(request);

              case 4:
                _context2.next = 6;
                return this._brokerFacade.expectResponse(requestUid, 5000);

              case 6:
                response = _context2.sent;
                return _context2.abrupt('return', response.payload);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      return function execute(_x3, _x4) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'listen',
    value: function listen(event, callback) {}
  }]);
  return ReefClient;
})();

exports.default = ReefClient;