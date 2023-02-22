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
    const TARGET_NAME = event['target-name'];
    const TARGET_DATA = JSON.stringify(event['target-data']);
    //==============================================================
    const CURR_DATE = new Date();
    const UTC = CURR_DATE.getTime() + (CURR_DATE.getTimezoneOffset() * 60 * 1000);
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const KR_CURR_DATE = new Date(UTC + KR_TIME_DIFF);  
    //==============================================================
    const NOW_DATE = dateFormat(KR_CURR_DATE,'yyyy-mm-dd');   
    const EXCEL_DATA = event['excelData'];
    let insertSql = 'insertSql';
    //==============================================================
    EXCEL_DATA.forEach((data, idx, arr) => {
      const mobileYN = data[6] === 'PC' ? 'N' : 'Y';
      let sql = '';
      if(arr.length!==idx+1){
        sql = `('${data[12]!==undefined?data[12]:''}', '${data[11]!==undefined?data[11]:''}', '${data[8]!==undefined?data[8]:''}', '${data[10]!==undefined?data[10]:''}', '${data[1]!==undefined?data[1]:''}', '${mobileYN}', 'N', 'N', '${data[7]!==undefined?data[7]:''}'),`;
      }else{
        sql = `('${data[12]!==undefined?data[12]:''}', '${data[11]!==undefined?data[11]:''}', '${data[8]!==undefined?data[8]:''}', '${data[10]!==undefined?data[10]:''}', '${data[1]!==undefined?data[1]:''}', '${mobileYN}', 'N', 'N', '${data[7]!==undefined?data[7]:''}')`;
      }
      insertSql += sql;
    });
    //==============================================================
    // console.log('insertSql', insertSql);
    //==============================================================
    (async () => {
      connection.query(insertSql, (err, queryResult, fields) => {
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