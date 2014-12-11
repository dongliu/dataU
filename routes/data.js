var ad = require('../config/ad.json');

var ldapClient = require('../lib/ldap-client');

var request = require('request');
var dataconfig = require('../config/data.json');

module.exports = function (app) {
  app.get('/pvs/:id/:format', function (req, res) {
    if (req.params.id === undefined) {
      return res.send(400, 'need pv name');
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
      console.log(err);
      return res.send(503, 'cannot retrieve device list from ' + dataconfig.pvdataurl);
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
      console.log(err);
      return res.send(503, 'cannot retrieve summary from ' + dataconfig.hourlogreport);
    }).pipe(res);
  });

  app.get('/users/:id/photo', function (req, res) {
    var searchFilter = ad.searchFilter.replace('_id', req.params.id);
    var opts = {
      filter: searchFilter,
      attributes: ad.rawAttributes,
      scope: 'sub'
    };
    ldapClient.search(ad.searchBase, opts, true, function (err, result) {
      if (err) {
        return res.json(500, err);
      }
      if (result.length === 0) {
        return res.json(500, {
          error: req.params.id + ' is not found!'
        });
      }
      if (result.length > 1) {
        return res.json(500, {
          error: req.params.id + ' is not unique!'
        });
      }
      res.set('Content-Type', 'image/jpeg');
      return res.send(result[0].thumbnailPhoto);
    });
  });
};
