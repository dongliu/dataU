/*global moment: false, Dygraph: false*/
function updateClock() {
  var now = moment();
  $('#day').text(now.format('dddd, Do MMMM YYYY'));
  $('#time').text(now.format('HH:mm'));
}

function timedUpdate() {
  updateClock();
  // update other information
  setTimeout(timedUpdate, 1000);
}

$(function () {
  var now = moment();
  var plot;
  var plotdata = [];
  timedUpdate();
  $.ajax({
    url: '/pvs/Z013L-C/json',
    data: {
      to: now.toISOString(),
      from: now.subtract(12, 'h').toISOString
    },
    dataType: 'json'
  }).done(function (json) {
    var i, a = json[0].data;
    for (i = 0; i < a.length; i += 1) {
      plotdata.push([new Date(a[i].secs * 1000), a[i].val]);
    }
    plot = new Dygraph('beam-plot', plotdata, {
      labels: ['Date', 'Primary Beam Intensity (Amps)'],
      // ylabel: '',
      xAxisLabelWidth: 100,
      legend: 'always',
      colors: ['#0033CC'],
      height: 150
    });
  }).fail(function (jqXHR, status, error) {
    //do something;
  });

});
