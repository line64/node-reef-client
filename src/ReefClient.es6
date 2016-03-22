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

  async query(type, params) {

    let requestUid = uid();

    let request = {
      reefDialect: 'reef-v1-query',
      queryType: type,
      payload: params,
      uid: requestUid
    };

    let responsePromise = this._brokerFacade.expectResponse(requestUid, 30000);

    await this._brokerFacade.enqueueRequest(request);

    let response = await responsePromise;

    response.acknowledge();

    return response.payload;

  }

  execute(type, params) {
  
    return new Promise((resolve, reject) => {
          
        let requestUid = uid();

        let request = {
        reefDialect: 'reef-v1-command',
        commandType: type,
        payload: params,
        uid: requestUid
        };

        this._brokerFacade.expectResponse(requestUid, 5000).then((response) => {
            
            response.acknowledge();
                
            resolve(response.payload);
        
        });
   
        this._brokerFacade.enqueueRequest(request);
    });    

  }

  listen(event, callback) {

  }

}
