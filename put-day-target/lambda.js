const { processLambdaFunction, returnThen, returnCatch } = require("@sizeko/awslambda-builder");
//==============================================================
exports.handler = async (event, context) => {
try { return await processLambdaFunction({
  permission: {
    commandline: {},
    preprocess: {},
    websocket: {},
    urlpost: {},
    schedule: {}    
  },
  validation: {
    input: {event: event, context: context},
    rule: {},
  },
  outputFormat: {
    itemName: 'sqlQueryResult',
    jsonPath: '$.isSuccess["sqlQueryResult"]',
  },
  preProcessFunctions: [],
  conditionalFunctions: [],
  defaultFunction: (event, context, outputFormat, resolve, reject, preProcessResult) => {
    //==============================================================
    const mysql = require('mysql');
    //==============================================================
    console.log(event);
    // console.log(preProcessResult);
    //==============================================================
    const connection = mysql.createConnection({
      host: process.env.RDS_HOSTNAME,
      user: process.env.RDS_USERNAME,
      database: process.env.RDS_DATABASE,
      password: process.env.RDS_PASSWORD,
    });
    const processError = (err) => {
      console.log(err);
      connection.destroy();
      resolve({
        outputFormat: outputFormat,
        isJSON: {
          queryResult: err
        }
      }); 
    };
    const connectionEnd = () => {
      connection.end(function(err){
        if(err) {
          console.log(err);
          reject(err);
        }
      });
    };     
    //==============================================================
    let QUERY = '';
    if(event['idx']!==undefined){
      QUERY = `QUERY`;
    }else{
      QUERY = `QUERY`; 
    }
    //==============================================================
    // console.log('QUERY', QUERY);
    //==============================================================
    (async () => {
      connection.query(QUERY, (err, queryResult, fields) => {
        if(err) processError(err);
        else {
          connectionEnd();
          resolve({
            outputFormat: outputFormat,
            isJSON: {
              queryResult 
            }
          });           
        }
      });
    })();
  }
}).then(param => {
  return returnThen(param);
}).catch(err => {
  return returnCatch(context, err);
});
} catch(err) {
  return returnCatch(context, err);
}};