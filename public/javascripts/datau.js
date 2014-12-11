/*global moment: false, Dygraph: false, jsonPath*/
function padding(s) {
  return '0' + s;
}

// the template to etl the json
var template = {
  ccf_experiment_number: {
    e: '$[0].experiment.number',
    t: padding,
    l: '#ccf_experiment_number'
  },
  ccf_experiment_spokesperson: {
    e: '$[0].experiment.spokesperson',
    l: '#ccf_experiment_spokesperson'
  },
  ccf_experiment_title: {
    e: '$[0].experiment.title',
    l: '#ccf_experiment_title'
  },
  ccf_experiment_a1900Contact: {
    e: '$[0].experiment.a1900Contact',
    l: '#ccf_experiment_a1900Contact'
  }
};

function jsonETL(json, template) {
  var prop, value;
  for (prop in template) {
    if (template.hasOwnProperty(prop)) {
      value = jsonPath.eval(json, template[prop].e);
      if (value.length === 1) {
        if (typeof template[prop].t === 'function') {
          $(template[prop].l).text(template[prop].t(value[0]));
          // output[prop] = template[prop].t(value[0]);
        } else {
          $(template[prop].l).text(value[0]);
          // output[prop] = value[0];
        }
      } else {
        if (template[prop].hasOwnProperty('defaultValue')) {
          $(template[prop].l).text(template[prop].defaultValue);
          // output[prop] = template[prop].defaultValue;
        } else {
          $(template[prop].l).text('');
          // output[prop] = null;
        }
      }
    }
  }
}

function updateClock() {
  var now = moment();
  $('#day').text(now.format('dddd, Do MMMM YYYY'));
  $('#time').text(now.format('HH:mm'));
}

function timedUpdate() {
  updateClock();
  // update other information
  setTimeout(timedUpdate, 10 * 1000);
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
      from: now.subtract(12, 'h').toISOString()
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

  $.ajax({
    url: '/facilities/summary',
    dataType: 'json'
  }).done(function (json) {
    jsonETL(json, template);
  }).fail(function (jqXHR, status, error) {
    //do something;
  });

});
