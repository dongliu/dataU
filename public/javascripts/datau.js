/*global moment: false, Dygraph: false, jsonPath*/
var now;

function padding(s) {
  return '0' + s;
}

function charge(n) {
  if (n > 0) {
    return n + '+';
  }
  return '';
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
  },
  k500_mass: {
    e: '$[0].beamList.beam[?(@.system==="K500")].massNumber',
    l: '#k500_mass'
  },
  k500_element: {
    e: '$[0].beamList.beam[?(@.system==="K500")].symbol',
    l: '#k500_element'
  },
  k500_charge: {
    e: '$[0].beamList.beam[?(@.system==="K500")].elementCharge',
    t: charge,
    l: '#k500_charge'
  },
  k500_energy: {
    e: '$[0].beamList.beam[?(@.system==="K500")].energy',
    l: '#k500_energy'
  },
  k1200_mass: {
    e: '$[0].beamList.beam[?(@.system==="K1200")].massNumber',
    l: '#k1200_mass'
  },
  k1200_element: {
    e: '$[0].beamList.beam[?(@.system==="K1200")].symbol',
    l: '#k1200_element'
  },
  k1200_charge: {
    e: '$[0].beamList.beam[?(@.system==="K1200")].elementCharge',
    t: charge,
    l: '#k1200_charge'
  },
  k1200_energy: {
    e: '$[0].beamList.beam[?(@.system==="K1200")].energy',
    l: '#k1200_energy'
  },
  a1900_mass: {
    e: '$[0].beamList.beam[?(@.system==="A1900")].massNumber',
    l: '#a1900_mass'
  },
  a1900_element: {
    e: '$[0].beamList.beam[?(@.system==="A1900")].symbol',
    l: '#a1900_element'
  },
  a1900_charge: {
    e: '$[0].beamList.beam[?(@.system==="A1900")].elementCharge',
    t: charge,
    l: '#a1900_charge'
  },
  ccf_vault: {
    e: '$[0].vault.name',
    l: '#ccf_vault'
  },
  ccf_status: {
    e: '$[0].statusList.status[0].description',
    l: '#ccf_status'
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
        } else {
          $(template[prop].l).text(value[0]);
        }
      } else {
        if (template[prop].hasOwnProperty('defaultValue')) {
          $(template[prop].l).text(template[prop].defaultValue);
        } else {
          $(template[prop].l).text('');
        }
      }
    }
  }
}

function progressPercentage(time) {
  return Math.round((now.unix() - moment(time).unix()) / (24 * 36));
}

function progressBar(o) {
  return '<div style="width: ' + progressPercentage(o.timeStamp) + '%" class="progress-bar progress-bar-' + o.name.toLowerCase() + '">' + o.name + '</div>';
} 

function progress(a) {
  var i, out = '';
  for (i = 0; i < a.length; i += 1) {
    out += progressBar(a[i]);
  }
  return out;
}



function updateClock() {
  now = moment();
  $('#day').text(now.format('dddd, Do MMMM YYYY'));
  $('#time').text(now.format('HH:mm'));
}

function timedUpdate() {
  updateClock();
  // update other information
  setTimeout(timedUpdate, 10 * 1000);
}

$(function () {
  now = moment();
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
    $('#ccf_progress').html(progress(json[0].statusList.status));
  }).fail(function (jqXHR, status, error) {
    //do something;
  });

});
