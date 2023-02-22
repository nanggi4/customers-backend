let AWS = require('aws-sdk');
let s3 = new AWS.S3();
//==============================================================
exports.handler = async (event,context) => {
  let lambdaResponse;
  try {
    //==============================================================
    console.log(event);
    console.log(context);
    //==============================================================
    let sendResponse = function(param){
      let response = {};
      response.body = JSON.stringify({});
      if(param.headers) response.headers = param.headers;
      if(param.result&&param.result.body) response.body = JSON.stringify(param.result.body);
      if(param.result&&param.result.file) response.body = param.result.file;
      if(param.option&&param.option.Return&&param.option.Return.Type=='ReturnTypeBodyOnly'){
        response = param.result.body;
      }
      if(event.Records){
        response.status = 200;
      }
      if(param.err) param.promise.reject(param.err);
      else param.promise.resolve(response);
    };
    //==============================================================
    // html page requst
    //==============================================================
    lambdaResponse = await new Promise((resolve,reject) => {
      // const { promisify } = require('util');
      let _headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,HEAD',
        'Content-Type':'text/html',
        'Content-Encoding':'UTF-8',
      };
      if(event.Records){
        _headers = {
          'access-control-allow-origin':[{
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }],
          'access-control-allow-methods':[{
            key: 'Access-Control-Allow-Methods',
            value: 'OPTIONS,POST,GET,HEAD'
          }],
          'content-type': [{
            key: 'Content-Type',
            value: 'text/html'
          }],
          'content-encoding': [{
            key: 'Content-Encoding',
            value: 'UTF-8'
          }],
        };
      }
      //==============================================================
      let s3file = {
        Bucket: 'Bucket',
        Key: 'index.html'
      };
      if(event.headers.Host.match(/dev[0-9]+\.customers\.io/g))
      {
        s3file.Bucket = 's3file.Bucket';
      }
      s3.getObject(s3file, function(err, fileData) {
        if (err) console.log(err);
        sendResponse({
          promise:{resolve:resolve,reject:reject},
          headers:_headers,
          result:{file:fileData.Body.toString('ascii')},
          err:err
        });
      });
      //==============================================================
    });
    //==============================================================
  }
  catch (err) {
    console.log(err);
    return err;
  }
  return lambdaResponse;
};