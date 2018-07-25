//The goal here is to provide basic crud services
//on named record types, while hiding the underlying
//technology.

//createOnly(obj, recordType, keyField) -- Error if exists
//crupdate(obj, , recordType, keyField) -- Create or update
//readAll(recordTye)
//findAll(recordType, keyField, keyValue)
//deleteAll(recordType, keyField, keyValue)

let mongodb = require('mongodb');
let MongoClient = mongodb.MongoClient;

////STRIP _id FROM RETURNED OBJECTS!!!!!

//Our exported function 
//which returns a promise resoving to the store object.
function connect(dbUrl, dbName) {

    console.log('Connecting...');

    let store = {};//The point of the exercise.
    return new Promise((resolve, reject)=>{

        console.log('Creating promise...');

        MongoClient.connect(dbUrl).then((client)=>{

            console.log('Got the mongo client from connect\'s promise.');

            let db = client.db(dbName);

            //Create a document in collection recordType,
            //  but only if a document with obj's keyField values doesn't already exist.
            //Returns a promise that resolves to obj if successful, or false if a document
            //  with that keyField value already exists.
            //Promise rejects of there is a db access problem or other unexpected error.
            store.createOnly = (obj, recordType, keyField)=>{
                let searchCrit = {};
                searchCrit[keyField] = obj[keyField];
                return new Promise((resolve, reject)=>{
                    db.collection(recordType).find(searchCrit).toArray().then((arr)=>{
                        if (arr.length) {
                            resolve(false);
                        } else {
                            db.collection(recordType).insertOne(obj)
                            .then(()=>{resolve(obj);})
                            .catch((err)=>{reject(err);});
                        }
                    })
                    .catch((e)=>{reject(e);})
                });
            };

            //Create or update. Returns a promise.
            store.crupdate = (obj, recordType, keyField)=>{
                let searchCrit = {};
                searchCrit[keyField] = obj[keyField];
                console.log('searchCrit:' + JSON.stringify(searchCrit));
                console.log('obj:' + JSON.stringify(obj));
                return db.collection(recordType).update(searchCrit, obj, {upsert:true});
            }; 

            //Returns a promise with an array
            store.readAll = (recordType)=>{
                return new Promise(function(resolve, reject) {
                    db.collection(recordType).find({}).toArray().then((arr)=>{
                        arr.forEach((element)=>{delete element._id;})
                        resolve(arr);
                    })
                    .catch((err)=>{
                        reject(err);
                    });
                });
            };

            //Returns a promise with an array.
            store.findAll = (recordType, keyField, keyValue)=>{
                let searchCrit = {};
                searchCrit[keyField] = keyValue;
                return new Promise(function(resolve, reject) {
                    db.collection(recordType).find(searchCrit).toArray().then((arr)=>{
                        arr.forEach((element)=>{delete element._id;});
                        resolve(arr);
                    })
                    .catch((err)=>{
                        reject(err);
                    });
                });
            };

            //Returns a promise.
            store.deleteAll = (recordType, keyField, keyValue)=>{
                let searchCrit = {};
                searchCrit[keyField] = keyValue;
                return db.collection(recordType).deleteMany(searchCrit);
            };

            //Returns a promise. Will delete at most one record.
            store.deleteOne = (recordType, keyField, keyValue)=>{
                let searchCrit = {};
                searchCrit[keyField] = keyValue;
                return db.collection(recordType).deleteOne(searchCrit);
            };

            resolve(store);
        });

    });
}

module.exports = connect;

