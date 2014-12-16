var ad = require('../config/ad.json');
var ldapClient = require('../lib/ldap-client');
var request = require('request');
var fs = require('fs');
var moment = require('moment');

var debug = require('debug')('dataU');

var dataconfig = require('../config/data.json');
var pending_photo;
var options = {
  root: __dirname + '/../public/images/staff/',
  maxAge: 30 * 24 * 3600 * 1000
};

var update = {};

var plotUpdate = [];

var pvs = [{
  name: 'K5MN_LVL_LCKD'
}, {
  name: 'K12_VLTSEC_IND'
}, {
  name: 'XFR_M_DOOR_LED'
}, {
  name: 'S1_VAULT_SECUR'
}, {
  name: 'S3_VAULT_SECUR'
}, {
  name: 'N3_VAULT_SECUR'
}, {
  name: 'N4_VAULT_SECUR'
}, {
  name: 'STRCHAN27',
  type: 'string'
}, {
  name: 'K8FREQ'
}];

function fetch_from_ad(id) {
  var searchFilter = ad.searchFilter.replace('_id', id);
  var opts = {
    filter: searchFilter,
    attributes: ad.rawAttributes,
    scope: 'sub'
  };
  ldapClient.search(ad.searchBase, opts, true, function (err, result) {
    var res_list = pending_photo[id];
    delete pending_photo[id];
    if (err) {
      console.error(err);
      res_list.forEach(function (res) {
        res.status(500).json({
          error: 'ldap error'
        });
      });
    } else {
      if (result.length === 0) {
        res_list.forEach(function (res) {
          res.status(500).json({
            error: id + ' is not found'
          });
        });
      }
      if (result.length > 1) {
        res_list.forEach(function (res) {
          res.status(500).json({
            error: id + ' is not unique!'
          });
        });
      } else {
        fs.writeFile(options.root + id + '.jpg', result[0].thumbnailPhoto, function (err) {
          if (err) {
            console.error(err);
            res_list.forEach(function (res) {
              res.status(500).json({
                error: 'cannot access file.'
              });
            });
          } else {
            res_list.forEach(function (res) {
              res.sendFile(id + '.jpg', options);
            });
          }
        });
      }
    }
  });
}

function getPV(pv, now) {
  request({
    url: dataconfig.pvdataurl + '.csv',
    qs: {
      pv: pv.name,
      from: now.toISOString()
    },
    timeout: 30 * 1000
  }, function (error, response, body) {
    var firstLine;
    if (error) {
      console.error(error);
    } else {
      if (response.statusCode === 200) {
        firstLine = body.split('\n')[0].split(',');
        if (firstLine.length === 2) {
          update[pv.name] = {
            timeStamp: Number(firstLine[0]),
            value: pv.type === 'string' ? firstLine[1] : Number(firstLine[1])
          };
        }
      }
    }
  });
}

function getPlot(pv, now) {
  // cache the data from 60 seconds ago to now
  request({
    url: dataconfig.pvdataurl + '.json',
    qs: {
      pv: pv.name,
      from: moment.unix(now.unix() - 60).toISOString()
    },
    timeout: 30 * 1000
  }, function (error, response, body) {
    if (error) {
      console.error(error);
    } else {
      if (response.statusCode === 200) {
        plotUpdate = body;
      }
    }
  });
}

function updatePVs(pvs) {
  // var now = (new Date()).toISOString();
  var now = moment();
  debug('retrieving pv values at ' + now);
  pvs.forEach(function (pv) {
    getPV(pv, now);
  });
  getPlot({name: 'Z013L-C'}, now);
  setTimeout(function () {
    updatePVs(pvs);
    getPlot({name: 'Z013L-C'}, now);
  }, 25 * 1000);
}

module.exports = function (app) {
  // start to update PVs task
  updatePVs(pvs);

  pending_photo = app.get('pending_photo');

  app.get('/pvupdates/json', function (req, res) {
    res.json(update);
  });

  app.get('/plotupdates/json', function (req, res) {
    res.type('json');
    res.send(plotUpdate);
  });

  app.get('/pvs/:id/:format', function (req, res) {
    if (req.params.id === undefined) {
      return res.status(400).send('need pv name');
    }
    var format = req.params.format || 'json';
    request({
      url: dataconfig.pvdataurl + '.' + format,
      qs: {
        pv: req.query.func ? req.query.func + '(' + req.params.id + ')' : req.params.id,
        from: req.query.from,
        to: req.query.to
      },
      timeout: 30 * 1000
    }).on('error', function (err) {
      console.error(err);
      return res.status(503).send('cannot retrieve device list from ' + dataconfig.pvdataurl);
    }).pipe(res);
  });

  app.get('/facilities/summary', function (req, res) {
    request({
      url: dataconfig.hourlogreport,
      strictSSL: false,
      headers: {
        Accept: 'application/json',
        'DISCS-Authorization': 'xxxx:zzz'
      },
      timeout: 30 * 1000
    }).on('error', function (err) {
      console.error(err);
      return res.status(503).send('cannot retrieve summary from ' + dataconfig.hourlogreport);
    }).pipe(res);
  });

  app.get('/users/:id/photo', function (req, res) {
    // if pending, register the request
    if (pending_photo[req.params.id]) {
      pending_photo[req.params.id].push(res);
    }
    // if not pending and in file, then get the file
    if (pending_photo[req.params.id] === undefined) {
      if (fs.existsSync(options.root + req.params.id + '.jpg')) {
        res.sendFile(req.params.id + '.jpg', options);
      } else {
        pending_photo[req.params.id] = [res];
        fetch_from_ad(req.params.id);
      }
    }
  });
};
