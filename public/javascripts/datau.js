/*global moment: false, Dygraph: false, jsonPath*/

var datauGlobal = {
  now: null,
  release: null,
  plot: null,
  plotdata: [],
  maxLength: 100 * 1000,
  facilityStatus: [],
  heights: [58, 1019, 260, 260, 176, 297],
  operators: []
};

function padding(s) {
  return '0' + s;
}

function charge(n) {
  if (n > 0) {
    return n + '+';
  }
  return '';
}

function mass(n) {
  return n > 0 ? n : '';
}

function updateImage(img) {
  var old = '';
  return function (id) {
    if (id !== old) {
      old = id;
      $(img).attr('src', './users/' + old + '/photo');
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
    dom: '#ccf_rf',
    t: function (n) {
      return n.toFixed(4);
    }
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
    t: mass,
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
    t: mass,
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
    t: mass,
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
  rea_mass: {
    e: '$[1].beamList.beam[?(@.system==="rea")].massNumber',
    l: '#rea_mass'
  },
  rea_element: {
    e: '$[0].beamList.beam[?(@.system==="rea")].symbol',
    l: '#rea_element'
  },
  rea_charge: {
    e: '$[0].beamList.beam[?(@.system==="rea")].elementCharge',
    t: charge,
    l: '#rea_charge'
  },
  rea_energy: {
    e: '$[0].beamList.beam[?(@.system==="rea")].energy',
    l: '#rea_energy'
  },
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
  var i, out = '',
    p;
  for (i = 0; i < a.length; i += 1) {
    p = progressPercentage(a[i][0], (i === 0 ? datauGlobal.now.unix() : a[i - 1][0]));
    out += '<div style="width: ' + p + '%" class="progress-bar progress-bar-' + a[i][1].toLowerCase() + '">' + (p > 2 ? a[i][1] : '') + '</div>';
  }
  return out;
}

function progress24(a) {
  var i, out = [];
  var adayago = datauGlobal.now.unix() - 24 * 3600;
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

function collapse(a) {
  var i = 1;
  while (i < a.length) {
    if (a[i][1] === a[i - 1][1]) {
      a.splice(i - 1, 1);
    } else {
      i += 1; //go to next in line
    }
  }
  return a;
}

function operator(id, first, last) {
  return '<div class="inline"><div class="inline"><img alt="Operator on shif" height="144px" data-src="holder.js/108x144/text:Operator on shift" src="./users/' + id + '/photo"></div><div class="inline"><div class="text-msu">Operator</div><div class="text-msu">on shift</div><div class="text-large"><div class="shift_first">' + first + '</div><div class="shift_last">' + last + '</div></div></div></div>';
}

function addOperators(operators, first, last) {
  var i;
  $('#operators').empty();
  for (i = 0; i < operators.length; i += 1) {
    $('#operators').append(operator(operators[i], first[i], last[i]));
  }
}

function updateOperators(json) {
  var operators = [];
  var first = [];
  var last = [];
  var charge, staff, i;
  if (json[0] && json[0].shift.staffList.shiftStaff) {
    charge = json[0].shift.operatorInCharge.loginId;
    staff = json[0].shift.staffList.shiftStaff;
    for (i = 0; i < staff.length; i += 1) {
      if (staff[i].role.name === "Operator" && staff[i].employee.loginId !== charge) {
        operators.push(staff[i].employee.loginId);
        first.push(staff[i].employee.firstName);
        last.push(staff[i].employee.lastName);
      }
    }
    if (operators.length && operators.toString() !== datauGlobal.operators.toString()) {
      datauGlobal.operators = operators;
      addOperators(operators, first, last);
    }
  }
}

function updateClock() {
  $('#day').text(datauGlobal.now.format('dddd, Do MMMM YYYY'));
  $('#time').text(datauGlobal.now.format('HH:mm'));
}

function updateFromHourlog() {
  $.ajax({
    url: './facilities/summary',
    dataType: 'json',
    ifModified: true
  }).done(function (json, textStatus, jqXHR) {
    if (jqXHR.status === 200) {
      jsonETL(json, template);
      updateOperators(json);
      datauGlobal.facilityStatus = [];
      if (json[0] && json[0].statusList && json[0].statusList.status) {
        datauGlobal.facilityStatus.push(json[0].statusList.status);
      }
      if (json[1] && json[1].statusList && json[1].statusList.status) {
        datauGlobal.facilityStatus.push(json[1].statusList.status);
      }
    }
  }).fail(function (jqXHR, status, error) {
    //do something;
  }).always(function () {
    if (datauGlobal.facilityStatus[0]) {
      $('#ccf_progress').html(progressBar(collapse(progress24(datauGlobal.facilityStatus[0]))));
    }
    if (datauGlobal.facilityStatus[1]) {
      $('#rea_progress').html(progressBar(collapse(progress24(datauGlobal.facilityStatus[1]))));
    }
  });
}

function updatePVs(json) {
  var prop, value;
  for (prop in pvs) {
    if (pvs.hasOwnProperty(prop)) {
      value = json[pvs[prop].name].value;
      if (value !== pvs[prop].currentValue) {
        pvs[prop].currentValue = value;
        if (pvs[prop].t && typeof pvs[prop].t === 'function') {
          $(pvs[prop].dom).text(pvs[prop].t(value));
        } else {
          $(pvs[prop].dom).text(value);
        }
      }
    }
  }
}

function setLED(dom, value) {
  if (value === 1) {
    $(dom).removeClass('text-muted').addClass('led-success');
  } else {
    $(dom).removeClass('led-success').addClass('text-muted');
  }
}

function updateLEDs(json) {
  var prop, value;
  for (prop in leds) {
    if (leds.hasOwnProperty(prop)) {
      value = json[leds[prop].name].value;
      if (value !== leds[prop].currentValue) {
        leds[prop].currentValue = value;
        setLED(leds[prop].dom, value);
      }
    }
  }
}


function eventUpdate() {
  $.ajax({
    url: './events/json',
    dataType: 'json',
    ifModified: true
  }).done(function (json, textStatus, jqXHR) {
    if (jqXHR.status === 200) {
      if (datauGlobal.release === null) {
        if (json.release) {
          // first load
          datauGlobal.release = json.release;
        }
      } else if (json.release !== datauGlobal.release) { // not first time, and need a refresh
        window.location.reload(true);
      }
    }
  }).fail(function (jqXHR, status, error) {
    console.log(error);
    //do something;
  });
}

function groupUpdate() {
  $.ajax({
    url: './pvupdates/json',
    dataType: 'json',
    ifModified: true
  }).done(function (json, textStatus, jqXHR) {
    if (jqXHR.status === 200) {
      updateLEDs(json);
      updatePVs(json);
    }
  }).fail(function (jqXHR, status, error) {
    console.log(error);
    //do something;
  });
}


function initPlot() {
  $.ajax({
    url: './pvs/Z013L-C/json',
    data: {
      from: moment.unix(datauGlobal.now.unix() - 12 * 3600).toISOString()
    },
    dataType: 'json'
  }).done(function (json) {
    var i, a = json[0].data;
    for (i = 0; i < a.length; i += 1) {
      if (a[i].val > 0) {
        datauGlobal.plotdata.push([new Date(a[i].secs * 1000 + a[i].nanos / 1000000), a[i].val]);
      } else {
        datauGlobal.plotdata.push([new Date(a[i].secs * 1000 + a[i].nanos / 1000000), 0]);
      }
    }
    datauGlobal.plot = new Dygraph('beam-plot', datauGlobal.plotdata, {
      labels: ['Date', 'Primary Beam Intensity'],
      // ylabel: '',
      legend: 'always',
      colors: ['#0033CC'],
      stepPlot: true,
      height: 250
    });
  }).fail(function (jqXHR, status, error) {
    //do something;
  });
}

function updatePlot() {
  if (datauGlobal.plotdata.length === 0) {
    initPlot();
  } else {
    $.ajax({
      url: './plotupdates/json',
      dataType: 'json',
      ifModified: true
    }).done(function (json, textStatus, jqXHR) {
      if (jqXHR.status === 200) {
        var i, a = json[0].data,
          toshift = 0,
          last = datauGlobal.plotdata[datauGlobal.plotdata.length - 1][0];
        // add new data
        for (i = 0; i < a.length; i += 1) {
          if (a[i].val > 0) {
            if (moment(a[i].secs * 1000 + a[i].nanos / 1000000).isAfter(last)) {
              datauGlobal.plotdata.push([new Date(a[i].secs * 1000 + a[i].nanos / 1000000), a[i].val]);
            }
          } else {
            if (moment(a[i].secs * 1000 + a[i].nanos / 1000000).isAfter(last)) {
              datauGlobal.plotdata.push([new Date(a[i].secs * 1000 + a[i].nanos / 1000000), 0]);
            }
          }
        }
        var endValue = datauGlobal.plotdata[datauGlobal.plotdata.length - 1][1];
        if (datauGlobal.plotdata.length > 1 && endValue === datauGlobal.plotdata[datauGlobal.plotdata.length - 2][1]) {
          // replace the last spot to current
          datauGlobal.plotdata[datauGlobal.plotdata.length - 1][0] = datauGlobal.now.toDate();
        } else {
          // add a new spot
          datauGlobal.plotdata.push([datauGlobal.now.toDate(), endValue]);
        }
        datauGlobal.plot.updateOptions({
          file: datauGlobal.plotdata,
          dateWindow: [(datauGlobal.now.unix() - 12 * 3600) * 1000, datauGlobal.now.unix() * 1000]
        });
        toshift = datauGlobal.plotdata.length - datauGlobal.maxLength;
        for (i = 0; i < toshift; i += 1) {
          datauGlobal.plotdata.shift();
        }
      }
    }).fail(function (jqXHR, status, error) {
      //do something;
      console.log(error);
    });
  }
}

function timedUpdate() {
  datauGlobal.now = moment();
  updateClock();
  updateFromHourlog();
  updatePlot();
  groupUpdate();
  // update other information
}

function setHeight() {
  if ($(window).width() >= 1900) {
    $('#heading').css('height', datauGlobal.heights[0]);
    $('#body').css('height', datauGlobal.heights[1]);
    $('#ccf').css('height', datauGlobal.heights[2]);
    $('#rea').css('height', datauGlobal.heights[3]);
    $('#ops').css('height', datauGlobal.heights[4]);
    $('#last').css('height', datauGlobal.heights[5]);
  } else {
    $('#heading').css('height', 'auto');
    $('#body').css('height', 'auto');
    $('#ccf').css('height', 'auto');
    $('#rea').css('height', 'auto');
    $('#ops').css('height', 'auto');
    $('#last').css('height', 'auto');
  }
}

$(function () {
  setHeight();
  $(window).resize(setHeight);
  datauGlobal.now = moment();
  updateClock();
  updateFromHourlog();
  updatePlot();
  groupUpdate();

  // fetch updates every 15 seconds
  setInterval(function () {
    timedUpdate();
  }, 15 * 1000);

  // check new release every 30 minutes
  setInterval(function () {
    eventUpdate();
  }, 30 * 60 * 1000);
});
