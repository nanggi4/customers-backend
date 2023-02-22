const { processLambdaFunction, returnThen, returnCatch } = require("@sizeko/awslambda-builder");
//==============================================================
exports.handler = async (event, context) => {
try { return await processLambdaFunction({
  permission: {
    commandline: {},
    preprocess: {},
    websocket: {},
    urlquery: {},
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
      database: process.env.RDS_HANWHA_DATABASE,
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
    const TARGET_NAME = event['target-name'];
    const TARGET_DATA = JSON.stringify(event['target-data']);
    //------------------------------------------------------
    const CURR_DATE = new Date();
    const UTC = CURR_DATE.getTime() + (CURR_DATE.getTimezoneOffset() * 60 * 1000);
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const KR_CURR_DATE = new Date(UTC + KR_TIME_DIFF);  
    //==============================================================
    const NOW_DATE = dateFormat(KR_CURR_DATE,'yyyy-mm-dd');
    let query = '';
    //==============================================================
    if(event['idx']===undefined){
      query = "query";
    }else{
      query = "query";
    }
    //==============================================================
    // console.log('query', query);
    //==============================================================
    (async () => {
      connection.query(query, (err, queryResult, fields) => {
        if(err) processError(err);
        else {
          connectionEnd();
          resolve({
            outputFormat: outputFormat,
            isJSON: {
              queryResult,
              query
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