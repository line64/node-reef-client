import bunyan from 'bunyan';

let log = bunyan.createLogger({
  name        : 'reef-client',
  level       : 'fatal',
  stream      : process.stdout,
  serializers : bunyan.stdSerializers
});

export default log;
