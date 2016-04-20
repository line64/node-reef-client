import uid from 'uid';

export default class ReefClient {

  constructor(brokerFacade) {

    this._brokerFacade = brokerFacade;

  }

  setup() {

    return this._brokerFacade.setup();

  }

  start() {

    this._brokerFacade.start();

  }

  stop() {

    this._brokerFacade.stop();

  }

  async query(domain, lane, type, params) {

    let requestUid = uid();

    let request = {
      reefDialect: 'reef-v1-query',
      domain: domain,
      lane: lane,
      queryType: type,
      payload: params,
      uid: requestUid
    };

    let responsePromise = this._brokerFacade.expectResponse(requestUid, 30*1000);

    await this._brokerFacade.enqueueRequest(request);

    let response = await responsePromise;

    response.acknowledge();

    return response.payload;

  }

  async execute(domain, lane, type, params) {

    let requestUid = uid();

    let request = {
      reefDialect: 'reef-v1-command',
      domain: domain,
      lane: lane,
      commandType: type,
      payload: params,
      uid: requestUid
    };

    let responsePromise = this._brokerFacade.expectResponse(requestUid, 30*1000);

    await this._brokerFacade.enqueueRequest(request);

    let response = await responsePromise;

    response.acknowledge();

    return response.payload;

  }

  listen(event, callback) {

  }

}
