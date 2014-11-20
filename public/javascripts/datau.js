/*global moment: false*/
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
  timedUpdate();
});