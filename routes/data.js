var express = require('express');
var router = express.Router();
var ad = require('../config/ad.json');
var ldapClient = require('../lib/ldap-client');
var request = require('request');
var fs = require('fs');
var moment = require('moment');
var debug = require('debug')('dataU');
var dataconfig = require('../config/data.json');
var pending_photo = {};
var options = {
  root: __dirname + '/../public/images/staff/',
  maxAge: 30 * 24 * 3600 * 1000
};
var update = {};
var plotUpdate = [];
var summary = {};
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

function cleanList(id, f) {
  var res_list = pending_photo[id];
  delete pending_photo[id];
  res_list.forEach(f);
}

function fetch_from_ad(id) {
  var searchFilter = ad.searchFilter.replace('_id', id);
  var opts = {
    filter: searchFilter,
    attributes: ad.rawAttributes,
    scope: 'sub'
  };
  ldapClient.search(ad.searchBase, opts, true, function (err, result) {
    if (err) {
      console.error(err);
      cleanList(id, function (res) {
        res.status(500).send('ldap error');
      });
    } else if (result.length === 0) {
      cleanList(id, function (res) {
        res.status(400).send(id + ' is not found');
      });
    } else if (result.length > 1) {
      cleanList(id, function (res) {
        res.status(400).send(id + ' is not unique!');
      });
    } else if (result[0].thumbnailPhoto && result[0].thumbnailPhoto.length) {
      if (!fs.existsSync(options.root + id + '.jpg')) {
        fs.writeFile(options.root + id + '.jpg', result[0].thumbnailPhoto, function (err) {
          if (err) {
            console.error(err);
          }
          cleanList(id, function (res) {
            res.set('Content-Type', 'image/jpeg');
            res.set('Cache-Control', 'public, max-age=' + options.maxAge);
            res.send(result[0].thumbnailPhoto);
          });
        });
      } else {
        cleanList(id, function (res) {
          res.set('Content-Type', 'image/jpeg');
          res.set('Cache-Control', 'public, max-age=' + options.maxAge);
          res.send(result[0].thumbnailPhoto);
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

function getSummary() {
  request({
    url: dataconfig.hourlogreport,
    strictSSL: false,
    headers: {
      Accept: 'application/json',
      'DISCS-Authorization': dataconfig.hourlogkey
    },
    timeout: 30 * 1000
  }, function (error, response, body) {
    if (error) {
      console.error(error);
    } else {
      if (response.statusCode === 200) {
        summary = body;
      }
    }
  });
}

function updatePVs(pvs) {
  var now = moment();
  debug('retrieving pv values at ' + now.format());
  pvs.forEach(function (pv) {
    getPV(pv, now);
  });
  getPlot({
    name: 'Z013L-C'
  }, now);
  getSummary();
  setTimeout(function () {
    updatePVs(pvs);
    getPlot({
      name: 'Z013L-C'
    }, now);
    getSummary();
  }, 30 * 1000);
}

updatePVs(pvs);

router.get('/pvupdates/json', function (req, res) {
  res.json(update);
});

router.get('/plotupdates/json', function (req, res) {
  res.type('json');
  res.send(plotUpdate);
});

router.get('/pvs/:id/:format', function (req, res) {
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
  }, function (err, response, resBody) {
    if (err) {
      console.error(err);
      return res.status(503).send('cannot retrieve pv values from ' + dataconfig.pvdataurl);
    }
    res.status(response.statusCode);
    if (response.statusCode === 200) {
      res.type(format);
    }
    res.send(resBody);
  });
});

router.get('/facilities/summary', function (req, res) {
  res.type('json');
  res.send(summary);
});

router.get('/users/:id/photo', function (req, res) {
  if (fs.existsSync(options.root + req.params.id + '.jpg')) {
    res.sendFile(req.params.id + '.jpg', options);
  } else {
    if (pending_photo[req.params.id]) {
      pending_photo[req.params.id].push(res);
    } else {
      pending_photo[req.params.id] = [res];
      fetch_from_ad(req.params.id);
    }
  }
});

module.exports = router;
