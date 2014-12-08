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
};
