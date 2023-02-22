const { processLambdaFunction, returnThen, returnCatch } = require("@sizeko/awslambda-builder");
//==============================================================
exports.handler = async (event, context) => {
try { return await processLambdaFunction({
  permission: {
    commandline: {},
    preprocess: {},
    websocket: {},
    urlquery: {},
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
    // const urlencode = require('urlencode');
    const dateFormat = require('dateformat');
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
      reject(err);
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
    let TODAY = new Date();
    // const BEFORE_ONE_MONTH = dateFormat(new Date(TODAY.getFullYear(), TODAY.getMonth()-1, TODAY.getDate()-1),'yyyy-mm-dd');
    const BEFORE_ONE_MONTH = dateFormat(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()),'yyyy-mm-01');
    const NOW_DATE = dateFormat(new Date(),'yyyy-mm-dd');
    //==============================================================
    let QUERY = '';
    //==============================================================
    QUERY += `QUERY`;
    //==============================================================
    // console.log('QUERY', QUERY);
    //==============================================================
    (async () => {
      connection.query(QUERY, (err, listQueryResult, fields) => {
        if(err) processError(err);
        else {
          connectionEnd();
          resolve({
            outputFormat: outputFormat,
            isJSON: {
              listQueryResult
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