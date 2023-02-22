const { AWSContainer, processLambdaFunction, returnThen, returnCatch } = require("@sizeko/awslambda-builder");
const awsContainer = new AWSContainer();
//==============================================================
exports.handler = async (event, context) => {
try { return await processLambdaFunction({
  permission: {
    commandline: {},
    urlquery: {},
    preprocess: {}
  },
  validation: {
    input: {event: event, context: context},
    rule: {
      //==============================================================
      ['searchValue']: {required: true, type: 'string'}
      //==============================================================
    },
  },
  outputFormat: {
    itemName: 'fileInfo',
    jsonPath: '$.isSuccess["fileInfo"]',
  },
  preProcessFunctions: [],
  conditionalFunctions: [],
  defaultFunction: (event, context, outputFormat, resolve, reject, preProcessResult) => {
    //==============================================================
    console.log(event);
    console.log(preProcessResult);
    //==============================================================
    const getPreSignedURLResolve = (param) => {
      const _preSignedURL = awsContainer.s3.getSignedUrl('getObject', {
        Bucket: process.env.S3_BUCKET_CUSTOMERS_REPORT_TRUNKPOOL,
        Key: param.fileName,
        Expires: 60*5
      });
      let _result = {
        fileName: param.fileName,
        preSignedURL: _preSignedURL
      };
      resolve({
        outputFormat: outputFormat,
        isJSON: _result
      });
    };    
    //==============================================================
    const formatDate = (date) => {
      var d = new Date(date),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear(),
          hours = d.getHours(),
          minutes = d.getMinutes(),
          seconds = d.getSeconds();
      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;
      if (hours.length < 2) hours = '0' + hours;
      if (minutes.length < 2) minutes = '0' + minutes;
      if (seconds.length < 2) seconds = '0' + seconds;
      return [`${year}${month}${day}`,`${hours}${minutes}${seconds}`].join('-');
    };
    //==============================================================
    const ExcelJS = require('exceljs');
    const mysql = require('mysql');
    const connection = mysql.createConnection({
      host: process.env.RDS_HOSTNAME,
      user: process.env.RDS_USERNAME,
      database: process.env.RDS_HANWHA_DATABASE,
      password: process.env.RDS_PASSWORD,
    });
    //==============================================================
    const SEARCH_AFCCD = JSON.parse(event['searchValue'])['afccd'];
    const SEARCH_CAMPAIGN = JSON.parse(event['searchValue'])['campaign'];
    const IS_SEARCH = SEARCH_AFCCD===''&&SEARCH_CAMPAIGN==='' ? false : true;
    //==============================================================
    const FILE_NAME = `afccd-${formatDate(new Date())}.xlsx`;
    let WHERE = '';
    let QUERY = '';
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
      QUERY = `QUERY`;      
    }
    else
    {
      QUERY = `QUERY`;      
    }    
    //==============================================================
    const _exportFields = ['idx','media','campaign','telNumber','insuCode','afccd','mobileYN','defaultYN','doubleYN','description','regDate','updateDate'];
    //==============================================================
    connection.query(QUERY, (err, RowDataPacket, fields) => {
      if(err){
        connection.destroy();
        reject(err);
      } else {
        // console.log(fields);
        let _columns = [];
        for(var i in fields)
        {
          if(_exportFields.includes(fields[i].name))
          {
            _columns.push({
              header: fields[i].name,
              key: fields[i].name,
            });
          }
        }
        //==============================================================
        connection.end(function(err){
          if(err){
            console.log(err);
            reject(err);
          }
        });
        //==============================================================
        const jsonResult = JSON.parse(JSON.stringify(RowDataPacket));
        const workbook = new ExcelJS.Workbook(); //creating workbook
        const worksheet = workbook.addWorksheet('hanwha'); //creating worksheet
        worksheet.columns = _columns;
        worksheet.addRows(jsonResult);
        const autoWidth = (worksheet, minimalWidth = 10) => {
          worksheet.columns.forEach((column) => {
            let maxColumnLength = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
              maxColumnLength = Math.max(
                maxColumnLength,
                minimalWidth,
                cell.value ? cell.value.toString().length : 0
              );
              if(maxColumnLength>40) maxColumnLength = 40;
            });
            column.width = maxColumnLength + 2;
          });
        };
        autoWidth(worksheet);
        //==============================================================
        const uploadProcess = async (workbook) => {
          const buffer = await workbook.xlsx.writeBuffer();
          awsContainer.s3.upload({
            Bucket: process.env.S3_BUCKET_CUSTOMERS_REPORT_TRUNKPOOL,
            Key: FILE_NAME,
            Body: buffer,
          }, function(err, data) {
            if (err) console.log(err);
            getPreSignedURLResolve({fileName: FILE_NAME});
          });
        };
        uploadProcess(workbook);
        //==============================================================
      }
    });
    //==============================================================
  }
}).then(param => {
  return returnThen(param);
}).catch(err => {
  return returnCatch(context, err);
});
} catch(err) {
  return returnCatch(context, err);
}};