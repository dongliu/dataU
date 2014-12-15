var ad = require('../config/ad.json');

var ldapClient = require('../lib/ldap-client');

var request = require('request');
var fs = require('fs');
var dataconfig = require('../config/data.json');
var pending_photo;
var options = {
  root: __dirname + '/../public/images/staff/',
  maxAge: 30 * 24 * 3600 * 1000
};

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
        res.status(500).json({error: 'ldap error'});
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

module.exports = function (app) {
  pending_photo = app.get('pending_photo');
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
      console.error(err);
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
      console.error(err);
      return res.send(503, 'cannot retrieve summary from ' + dataconfig.hourlogreport);
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
