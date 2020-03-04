// Author: Michael.Lagally@oracle.com
// Created: 7.5.2018
// Last modified: 26.6.2018

"use strict";

var fs = require("fs");
var path = require("path");
var baseDir = ".";

let appId="DD8B372C-D924-4EC9-A1BD-B0B8B5312A88";
let iotCSServer="129.150.193.97";

if (process.argv.length<5) {
   console.log ("Usage: node dm2td.jsdm2td.js <deviceModel.json> <IoTCSServer> <applicationID> <deviceId> [-v]");
   console.log ("Example: node tools-oracle/dm2td.js tools-oracle/DMs/Festo_Plant.json 129.150.193.97 DD8B372C-D924-4EC9-A1BD-B0B8B5312A88 FFC9E5B7-61E4-4B79-82AC-76DA9266949B");
   process.exit (-1);
}

var filename=process.argv[2];

iotCSServer = process.argv[3];
appId = process.argv[4];
var deviceId = process.argv[5];

var verbose=process.argv[6] ==="-v";

if (verbose) console.log(`td-dm started`);


var content=fs.readFileSync('./'+filename);
var path=filename.substring(0, filename.lastIndexOf("/"));
// get package directory name
var pkg=path.substring(path.lastIndexOf("/")+1);
// strip path and extension
var plainfn=path.substring(filename.lastIndexOf("/")+1, filename.lastIndexOf("."));

var dm=JSON.parse(content);
if (verbose) console.log(dm);

if (verbose) console.log("-----");

var td={};
td['@context']=["https://w3c.github.io/wot/w3c-wot-td-context.jsonld" ];
td.name=dm.name;
td.description=dm.description;
td.id=dm.urn;
let deviceUrn=dm.urn.replace(/:/g ,"%3A");
let base = "https://"+iotCSServer+"/iot/api/v2/apps/"+appId+"/devices/"+deviceId+"/deviceModels/"+deviceUrn;
td.base=base;
td.security=[{ "scheme" : "basic"	}];
var now=new Date(Date.now());
td.createdAsString=now.toISOString();
td.created=now.valueOf();
td.lastModifiedAsString=now.toISOString();
td.lastModified=now.valueOf();
td.userLastModified="auto-generated by dm2td converter";
td.support="https://servient.example.com/contact";
td.properties={};
td.actions={};

for(var exKey in dm.attributes) {
    if (verbose) console.log("key:"+exKey+", value:"+dm.attributes[exKey]);
    var iac=dm.attributes[exKey];
    if (verbose) console.log(iac);
    var prop={};
    prop.name=iac.name;
    prop.description=iac.description;
    prop.type=iac.type.toLowerCase();
    prop.writable=iac.writable;
    if (!iac.alias) {
      prop.label=iac.name;
    } else {
      prop.label=iac.alias;
    };

    let name=prop.name;
    // added object properties
    prop.type="object";
    prop.properties= {};
    prop.properties[name]={
        "type": iac.type.toLowerCase(),
        "writable": false
    };
    if (iac.writable) {
      prop.properties.value={
          "type": iac.type.toLowerCase(),
          "writable": true
      };
    };

    prop.forms = [{
      "href" :  base+"/attributes/"+iac.name,
      "mediaType": "application/json"
    }];


    if (verbose) console.log(prop);

    td.properties[iac.name]=prop;
}

for(var exKey in dm.actions) {
    if (verbose) console.log("key:"+exKey+", value:"+dm.actions[exKey]);
    var iac=dm.actions[exKey];
    if (verbose) console.log(iac);
    var act={};

    act.name=iac.name;
    act.description=iac.description;
    if (iac.argType) {
      var inp={};
      inp.type=iac.argType.toLowerCase();
      if (iac.range) {
        inp.minimum=iac.range.split(",")[0];
        inp.maximum=iac.range.split(",")[1];
      }
      act.input=inp;
    }
    if (!iac.alias) {
      act.label=iac.name;
    } else {
      act.label=iac.alias;
    };

    act.forms = [{
      "href" : base+"/actions/"+act.name,
      "mediaType": "application/json"
    }];

    td.actions[iac.name]=act;
}

if (verbose) console.log("-----");

console.log(JSON.stringify(td, null, "\t"));
