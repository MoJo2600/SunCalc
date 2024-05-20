
var SunCalc = require('./suncalc');

var date = new Date('2024-06-01UTC'),
    lat = 49.051944,
    lng = 11.782778,
    height = 514;

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

for (i = 0; i<24; i++) {
    curDate = date.setHours(i);
    var sunPos = SunCalc.getPosition(curDate, lat, lng);
    console.dir(sunPos);
}


// for (i = 0; i<365; i++) {
//     curDate = date.addDays(i);
//     var sunPos = SunCalc.getPosition(curDate, lat, lng);

//     console.dir(sunPos);

// }
