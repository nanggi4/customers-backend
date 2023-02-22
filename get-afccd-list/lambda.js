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
    const PAGE = Number(event['pageValue']);
    const LIMIT = Number(event['limitValue']);
    //==============================================================
    const CURR_DATE = new Date();
    const UTC = CURR_DATE.getTime() + (CURR_DATE.getTimezoneOffset() * 60 * 1000);
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const KR_CURR_DATE = new Date(UTC + KR_TIME_DIFF);  
    //==============================================================
    const NOW_DATE = dateFormat(KR_CURR_DATE,'yyyy-mm-dd'); 
    const LEFT_LIMIT = PAGE === 1 ? 0 : PAGE * LIMIT;
    const RIGHT_LIMIT = LIMIT;    
    const SEARCH_AFCCD = JSON.parse(event['searchValue'])['afccd'];
    const SEARCH_CAMPAIGN = JSON.parse(event['searchValue'])['campaign'];
    const IS_SEARCH = SEARCH_AFCCD===''&&SEARCH_CAMPAIGN==='' ? false : true;    
    //==============================================================
    let WHERE = '';
    let listQuery = '';
    let countQuery = '';
    //==============================================================
    if(IS_SEARCH)
    {
      if(SEARCH_AFCCD!==''&&SEARCH_CAMPAIGN===''){
        WHERE += `afccd = '${SEARCH_AFCCD}'`;
      }else if (SEARCH_AFCCD===''&&SEARCH_CAMPAIGN!==''){
        WHERE += `campaign = '${SEARCH_CAMPAIGN}'`;
      }else if (SEARCH_AFCCD!==''&&SEARCH_CAMPAIGN!==''){
        WHERE += `afccd = '${SEARCH_AFCCD}' && campaign = '${SEARCH_CAMPAIGN}'`;
      }else{
        WHERE += '';
      }
    }
    //==============================================================
    if(IS_SEARCH)
    {
      listQuery = `listQuery`;      
      countQuery = `countQuery`;
    }
    else
    {
      listQuery = `listQuery`;      
      countQuery = `countQuery`;
    }
    //==============================================================
    // console.log('listQuery', listQuery);
    // console.log('countQuery', countQuery);
    //==============================================================
    (async () => {
      connection.query(listQuery, (err, listQueryResult, fields) => {
        if(err) processError(err);
        else {
          connection.query(countQuery, (err, countQueryResult, fields) => {
            if(err) processError(err);
            else {
              connectionEnd();
              resolve({
                outputFormat: outputFormat,
                isJSON: {
                  countQueryResult,
                  listQueryResult 
                }
              });               
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