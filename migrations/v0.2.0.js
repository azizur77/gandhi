'use strict';

var r = require('rethinkdb');
var q = require('q');

var host = '127.0.0.1';
var db = 'gandhi';

// grab command line agrs
for (var i = 2; i < process.argv.length; i++) {
  if(process.argv[i] === '--host'){
    i++; host = process.argv[i];
  }

  else if(process.argv[i] === '--db'){
    i++; db = process.argv[i];
  }
};


r.connect({host: host, db: db}).then(function(conn){

  var tasks = [];

  // Cycles
  // ------

  tasks.push(r.table('cycles').replace(function(cycle){
    return cycle.merge({
      assignments: cycle('users').default(cycle('assignments')),
      stages: cycle('flow').default(cycle('stages')),
      open: ['open'],
      close: ['close'],
      events: r.literal(cycle('events').coerceTo('array').map(function(eventKV){
        return [eventKV.nth(0), eventKV.nth(1).without('messages')];
      }).coerceTo('object'))
    }).without({
      users: true,
      flow: true
    })
  }).run(conn));

  // tasks.push(r.table('cycles').map(function(cycle){
  //   return cycle('events').coerceTo('array').map(function(eventKV){
  //       return [eventKV.nth(0), eventKV.nth(1).without('messages')];
  //     }).coerceTo('object')
  // }).coerceTo('array').run(conn));

  // run all the tasks
  q.all(tasks).then(function(res){

    console.log('success:', JSON.stringify(res, null, 2));

    conn.close();
  }, function(err){
    console.error(err)
    conn.close();
  });
});