import uid from 'uid';
import EventeEmitter from 'events';

import ReceiptType from './ReceiptType';

export default class ReefClient extends EventeEmitter{

  constructor(brokerFacade) {

    super();

    this._brokerFacade = brokerFacade;
    
    this.timeout = 30*1000;

  }

  setup(options) {

    this._brokerFacade.on('info', (info) => this.emit('info', {Facade: info}) );

    this._brokerFacade.on('error', (error) => this.emit('error', {Facade: error}) );
    
    this.timeout = (options && options.timeout) ? options.timeout : this.timeout;

    return this._brokerFacade.setup();

  }

  start() {

    this._brokerFacade.start();

  }

  stop() {

    this._brokerFacade.stop();

  }

  async query(domain, lane, type, params, options) {

    let requestUid = uid();
    
    let request = {
      reefDialect: 'reef-v1-query',
      domain: domain,
      lane: lane,
      queryType: type,
      payload: params,
      uid: requestUid
    };

    let timeout = (options && options.timeout) ? options.timeout : this.timeout;
    
    let responsePromise = this._brokerFacade.expectResponse(requestUid, timeout);

    await this._brokerFacade.enqueueRequest(request);

    let response = await responsePromise;

    response.acknowledge();

    return response.payload;

  }

  async execute(domain, lane, type, params, options) {

    let requestUid = uid();
    
    let request = {
      reefDialect: 'reef-v1-command',
      domain: domain,
      lane: lane,
      commandType: type,
      payload: params,
      uid: requestUid,
      receiptType: ReceiptType.EXPECT_RECEIPT
    };
    
    let timeout = (options && options.timeout) ? options.timeout : this.timeout;

    let responsePromise = this._brokerFacade.expectResponse(requestUid, timeout);

    await this._brokerFacade.enqueueRequest(request);

    let response = await responsePromise;

    response.acknowledge();

    return response.payload;

  }

  async fireAndForget(domain, lane, type, params, options) {

    let requestUid = uid();

    let request = {
      reefDialect: 'reef-v1-command',
      domain: domain,
      lane: lane,
      commandType: type,
      payload: params,
      uid: requestUid,
      receiptType: ReceiptType.FIRE_AND_FORGET
    };

    return this._brokerFacade.enqueueRequest(request);
  }

  listen(event, callback) {

  }

}
