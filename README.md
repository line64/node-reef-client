# node-reef-client
A nodejs client for the Reef arquitectural pattern

#How to
Reef uses Amazon SQS queues, so you need an AWS account and the credentials to use it.

**Set up**

    import { SqsBrokerFacade, ReefClient } from 'reef-client';
    import bunyan from 'bunyan';

    let log = bunyan.createLogger({
      name        : 'foo',
      level       : process.env.LOG_LEVEL || 'info',
      stream      : process.stdout,
      serializers : bunyan.stdSerializers
    });

    let brokerFacade = new SqsBrokerFacade({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESSKEYID,
        secretAccessKey: process.env.AWS_SECRETACCESSKEY,
        clientDomain: "clientDomain",
        clientLane: "singleton"
    });

    log.info("Creating client");
    let reefClient = new ReefClient(brokerFacade);

    log.info('Adding listeners for info and error');
    reefClient.on('info', (info) => { log.info(info); });

    reefClient.on('error', (error) => { log.error(error); });

    log.info('Client setup');
    await reefClient.setup();

    log.info('Client start');
    await reefClient.start();

**Making a request**

There are three types of request:

*-Commands: The ones that modify something in the server (Similar to a PUT/POST in HTTP)*
      
      reefClient.execute(domain, lane, command, payload, options);
  
*-Fire and forget: The ones that don't need an answer, is a special type of command*
      
      reefClient.fireAndForget(domain, lane, command, payload, options);
  
*-Queries: The ones that only make consult (Similar to a GET in HTTP)*
      
      reefClient.query(domain, lane, command, payload, options);
  
  
*Example:*

    let domain = "database",
        lane = "singleton",
        command = "SAVE_USER",
        payload = {
          user: snowflake,
          name: Example,
          lastName: Foo
        },
        options = {
          timeout: 3000 //in milisecconds, this is the default value if nothing is passed (do not apply to fireAndForget)
        }
  
    let response;
  
    try {
        response = await reefClient.execute(domain, lane, command, payload, options);
        log.info('Response: ', response);
    } catch (e) {
        log.error("There was an error: ", e);
    }
    
    
#How does it work

Each service has a request queue compose of the domain and lane. For example a queue full name will be:

    serviceDomain-singleton-req

Each client has a response queue compose of the domain and lane. For example the queue name of the last example will be:

    clientDomain-singleton-res

The service in the other side will send a message through that queue, and the cliente will process that.
    
