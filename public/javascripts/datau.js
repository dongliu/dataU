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
  },
  rea_experiment_number: {
    e: '$[1].experiment.number',
    t: padding,
    l: '#rea_experiment_number'
  },
  rea_experiment_spokesperson: {
    e: '$[1].experiment.spokesperson',
    l: '#rea_experiment_spokesperson'
  },
  rea_experiment_title: {
    e: '$[1].experiment.title',
    l: '#rea_experiment_title'
  },
  rea_experiment_a1900Contact: {
    e: '$[1].experiment.a1900Contact',
    l: '#rea_experiment_a1900Contact'
  },
  // rea_mass: {
  //   e: '$[1].beamList.beam[?(@.system==="rea")].massNumber',
  //   l: '#rea_mass'
  // },
  // rea_element: {
  //   e: '$[0].beamList.beam[?(@.system==="rea")].symbol',
  //   l: '#rea_element'
  // },
  // rea_charge: {
  //   e: '$[0].beamList.beam[?(@.system==="rea")].elementCharge',
  //   t: charge,
  //   l: '#rea_charge'
  // },
  // rea_energy: {
  //   e: '$[0].beamList.beam[?(@.system==="rea")].energy',
  //   l: '#rea_energy'
  // },
  rea_vault: {
    e: '$[1].vault.name',
    l: '#rea_vault'
  },
  rea_status: {
    e: '$[1].statusList.status[0].description',
    l: '#rea_status'
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

function progressPercentage(start, end) {
  return (end - start) / (24 * 36);
}

function progressBar(a) {
  var i, out = '';
  for (i = 0; i < a.length; i += 1) {
    out += '<div style="width: ' + progressPercentage(a[i][0], (i === 0 ? now.unix() : a[i - 1][0])) + '%" class="progress-bar progress-bar-' + a[i][1].toLowerCase() + '">' + a[i][1] + '</div>';
  }
  return out;
}

function progress24(a) {
  var i, out = [];
  var adayago = now.unix() - 24 * 3600;
  var timeStamp;
  for (i = 0; i < a.length; i += 1) {
    timeStamp = moment(a[i].timeStamp).unix();
    if (timeStamp < adayago) {
      out.push([adayago, a[i].name]);
      return out;
    }
    out.push([timeStamp, a[i].name]);
  }
  // this mean we have no status recorded 24 hours ago
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
      from: moment.unix(now.unix() - 12 * 3600).toISOString()
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
    $('#ccf_progress').html(progressBar(progress24(json[0].statusList.status)));
    $('#rea_progress').html(progressBar(progress24(json[1].statusList.status)));
  }).fail(function (jqXHR, status, error) {
    //do something;
  });

});
