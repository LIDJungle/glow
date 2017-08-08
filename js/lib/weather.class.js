function Weather() {
    var self = this;
    this.data = {};
    this.tideData = {};

    // Return current temp in F
    this.getTempF = function (obj) {
        var F = Math.round(self.data['current_observation']['temp_f']);
        obj.set('text', F+"°");
    };
    // Return current temp in C
    this.getTempC = function (obj) {
        var C = Math.round(self.data['current_observation']['temp_c']);
        obj.set('text', C+"°");
    };

    this.getTidesH = function (obj) {
        var T = self.tideData.high[0]+" - "+self.tideData.high[1];
        obj.set('text', T);
    }
    this.getTidesL = function (obj) {
        var T = self.tideData.low[0]+" - "+self.tideData.low[1];
        obj.set('text', T);
    }

    this.update = function (zip) {
        //console.log("Updating!")
        var url="https://api.wunderground.com/api/b73e4a5d25bcfd5c/conditions/astronomy/q/"+zip+".json";
        var handle = $.ajax({
            dataType: "jsonp",
            url: url
        }).success(function(data) {
            console.log("Retrieved weather data", data);
            self.data = data;
        });
        return handle;
    };

    this.tides = function (station) {
        if (station == 'undefined' || typeof(station)  == 'undefined') {return;}  else {console.log("Station:", station);}
        var url="https://tidesandcurrents.noaa.gov/api/datagetter?date=today&station="+station+"&product=predictions&datum=MLLW&units=english&time_zone=lst_ldt&application=web_services&format=json";
        var handle = $.ajax({
            dataType: "json",
            url: url
        }).success(function(data) {
            console.log("Retrieved tides data", data);

            // Process tide data
            var tides = data.predictions;
            var last = {};
            var type = 'new';
            var tidesData = {high: [], low: []};
            for (var element in tides) {
                //console.log("Last: "+last.v+" Current: "+tides[element].v+" Direction: "+type);
                if (Object.keys(last).length === 0 && last.constructor === Object) {
                    last = tides[element];
                } else if (last.v > tides[element].v && type == 'new') {
                    // Numbers are going down - Look for lowest
                    last = tides[element]; type = 'low';
                } else if (last.v < tides[element].v && type == 'new') {
                    // Numbers are going up - Look for highest
                    last = tides[element]; type = 'high';
                } else if (last.v > tides[element].v && type == 'high') {
                    // Last one was highest - Log it and start looking for lows
                    tidesData.high.push(self.processTideDate(last.t));
                    last = tides[element]; type = 'low';
                } else if (last.v < tides[element].v && type == 'low') {
                    // Last one was lowest - Log it and start looking for highs
                    tidesData.low.push(self.processTideDate(last.t));
                    last = tides[element]; type = 'high';
                } else {
                    last = tides[element];
                }
            }
            self.tideData = tidesData;
        });
        return handle;
    };

    this.processTideDate = function(date) {
        var d = new Date(Date.parse(date));
        var hours = d.getHours();
        var minutes = (d.getMinutes()<10?'0':'') + d.getMinutes();
        var ampm = 'a';
        if (hours > 12) {
            hours = hours - 12; ampm = 'p';
        } else if (hours == 12) {
            ampm = 'p';
        } else if (hours == 0) {
            hours = 12;
        }
        return hours+":"+minutes+ampm;
    }
}