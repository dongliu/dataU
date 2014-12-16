/*global moment: false, Dygraph: false, jsonPath*/
var now;
var plot;
var plotdata = [];
var maxLength = 100 * 1000;

function padding(s) {
  return '0' + s;
}

function charge(n) {
  if (n > 0) {
    return n + '+';
  }
  return '';
}

function updateImage(img) {
  var old = '';
  return function (id) {
    if (id !== old) {
      old = id;
      $(img).attr('src', '/users/' + old + '/photo');
    }
    return;
  };
}

var pvs = {
  ccf_attenuator: {
    name: 'STRCHAN27',
    dom: '#ccf_att'
  },
  ccf_rf: {
    name: 'K8FREQ',
    dom: '#ccf_rf'
  }
};

// the led list

var leds = {
  k12: {
    name: 'K12_VLTSEC_IND',
    dom: '#k12'
  },
  s3: {
    name: 'S3_VAULT_SECUR',
    dom: '#s3'
  },
  n3: {
    name: 'N3_VAULT_SECUR',
    dom: '#n3'
  },
  n4: {
    name: 'N4_VAULT_SECUR',
    dom: '#n4'
  },
  k5: {
    name: 'K5MN_LVL_LCKD',
    dom: '#k5'
  },
  s1: {
    name: 'S1_VAULT_SECUR',
    dom: '#s1'
  },
  a19: {
    name: 'XFR_M_DOOR_LED',
    dom: '#a19'
  }
};

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
  ccf_experimenter_in_charge: {
    e: '$[0].shift.experimenterInCharge',
    l: '#ccf_experimenter_in_charge'
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
  rea_experimenter_in_charge: {
    e: '$[1].shift.experimenterInCharge',
    l: '#rea_experimenter_in_charge'
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
  },
  charge_first: {
    e: '$[0].shift.operatorInCharge.firstName',
    l: '#charge_first'
  },
  charge_last: {
    e: '$[0].shift.operatorInCharge.lastName',
    l: '#charge_last'
  },
  charge_id: {
    e: '$[0].shift.operatorInCharge.loginId',
    t: updateImage('#charge_image')
  },
  shift_first: {
    e: '$[0].shift.staffList.shiftStaff[?(@.role.name==="Operator")].employee.firstName',
    l: '#shift_first'
  },
  shift_last: {
    e: '$[0].shift.staffList.shiftStaff[?(@.role.name==="Operator")].employee.lastName',
    l: '#shift_last'
  },
  shift_id: {
    e: '$[0].shift.staffList.shiftStaff[?(@.role.name==="Operator")].employee.loginId',
    t: updateImage('#shift_image')
  },
  beam_first: {
    e: '$[0].shift.staffList.shiftStaff[?(@.role.name==="Beam Physicist")].employee.firstName',
    l: '#beam_first'
  },
  beam_last: {
    e: '$[0].shift.staffList.shiftStaff[?(@.role.name==="Beam Physicist")].employee.lastName',
    l: '#beam_last'
  },
  beam_id: {
    e: '$[0].shift.staffList.shiftStaff[?(@.role.name==="Beam Physicist")].employee.loginId',
    t: updateImage('#beam_image')
  },
  co_first: {
    e: '$[0].shift.staffList.shiftStaff[?(@.role.name==="Beam Coordinator")].employee.firstName',
    l: '#co_first'
  },
  co_last: {
    e: '$[0].shift.staffList.shiftStaff[?(@.role.name==="Beam Coordinator")].employee.lastName',
    l: '#co_last'
  },
  co_id: {
    e: '$[0].shift.staffList.shiftStaff[?(@.role.name==="Beam Coordinator")].employee.loginId',
    t: updateImage('#co_image')
  }
};

function jsonETL(json, template) {
  var prop, value;
  for (prop in template) {
    if (template.hasOwnProperty(prop)) {
      value = jsonPath.eval(json, template[prop].e);
      // might need a better compare here
      if (value[0] !== template[prop].currentValue) {
        template[prop].currentValue = value[0];
        if (typeof template[prop].t === 'function') {
          if (template[prop].l) {
            $(template[prop].l).text(template[prop].t(value[0]));
          } else {
            template[prop].t(value[0]);
          }
        } else {
          if (template[prop].l) {
            $(template[prop].l).text(value[0]);
          }
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
  $('#day').text(now.format('dddd, Do MMMM YYYY'));
  $('#time').text(now.format('HH:mm'));
}

function updateFromHourlog() {
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
}


function getPV(prop) {
  $.ajax({
    url: '/pvs/' + pvs[prop].name + '/csv',
    data: {
      from: now.toISOString()
    }
  }).done(function (data) {
    // console.log(data.split('\n')[0].split(',')[1]);
    var value = data.split('\n')[0].split(',')[1];
    if (value !== pvs[prop].currentValue) {
      pvs[prop].currentValue = value;
      $(pvs[prop].dom).text(value);
    }
  }).fail(function (jqXHR, status, error) {
    console.log(error);
    //do something;
  });
}

function updatePVs() {
  var prop, value;
  for (prop in pvs) {
    if (pvs.hasOwnProperty(prop)) {
      getPV(prop);
    }
  }
}

function setLED(dom, value) {
  if (value === '1') {
    $(dom).removeClass('text-muted').addClass('text-success');
  } else {
    $(dom).removeClass('text-success').addClass('text-muted');
  }
}

function getLED(prop) {
  $.ajax({
    url: '/pvs/' + leds[prop].name + '/csv',
    data: {
      from: now.toISOString()
    }
  }).done(function (data) {
    var value = data.split('\n')[0].split(',')[1];
    if (value !== leds[prop].currentValue) {
      leds[prop].currentValue = value;
      setLED(leds[prop].dom, value);
    }
  }).fail(function (jqXHR, status, error) {
    console.log(error);
    //do something;
  });
}

function updateLEDs() {
  var prop, value;
  for (prop in leds) {
    if (leds.hasOwnProperty(prop)) {
      getLED(prop);
    }
  }
}

function initPlot() {
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
      legend: 'always',
      colors: ['#0033CC'],
      height: 150
    });
  }).fail(function (jqXHR, status, error) {
    //do something;
  });
}

function updatePlot() {
  if (plotdata.length === 0) {
    initPlot(plot, plotdata);
  } else {
    $.ajax({
      url: '/pvs/Z013L-C/json',
      data: {
        to: now.toISOString(),
        from: moment(plotdata[plotdata.length - 1][0]).toISOString()
      },
      dateWindow: [(now.unix() - 12 * 3600) * 1000, now.unix() * 1000],
      dataType: 'json'
    }).done(function (json) {
      var i, a = json[0].data,
        toshift = 0;
      for (i = 0; i < a.length; i += 1) {
        plotdata.push([new Date(a[i].secs * 1000), a[i].val]);
      }
      plot.updateOptions({
        'file': plotdata
      });
      toshift = plotdata.length - maxLength;
      for (i = 0; i < toshift; i += 1) {
        plotdata.shift();
      }
    }).fail(function (jqXHR, status, error) {
      //do something;
    });
  }
}

function timedUpdate() {
  now = moment();
  updateClock();
  updateFromHourlog();
  updatePlot();
  updatePVs();
  updateLEDs();
  // update other information
}

$(function () {
  now = moment();
  updateClock();
  updateFromHourlog();
  updatePlot();
  updatePVs();
  updateLEDs();
  setInterval(function () {
    timedUpdate();
  }, 30 * 1000);
});
