player.pop = (function(p) {
    var my = {};


    my.add = function (popentries) {
        var pop = [];
        var now = new Date();
        localforage.getItem('pop').then(function(v){
            if (v === null) {pop = [];} else {pop = v;}
            $.each(popentries, function (idx, entry){
                console.log("Proof of play. Presid: "+entry['presId']+" v: "+entry['version']+" CompanyId: "+entry['coid']+" Count: "+entry['count']);
                pop.push({
                    'displayId': p.displayId,
                    'coid': entry['coid'],
                    'time': (now.getTime() / 1000),
                    'duration': p.param[0].cr,
                    'presId': entry['presId'],
                    'version': entry['version'],
                    'count': entry['count']
                });
            });
            localforage.setItem('pop', pop);
        });
    };

    my.send = function() {
        JL().debug("Sending POP.");
        console.log("Sending POP.");
        my.filterPop().then(function(){
            localforage.getItem('pop').then(function(v) {
                if (v.length > 500) {
                    var batch = v.splice(0, 500);
                } else {
                    var batch = v;
                }

                if (p.online) {
                    JL().debug("POP records: "+v.length+". Sending: "+batch.length+".");
                    console.log("POP records: "+v.length+". Sending: "+batch.length+".", batch);
                    console.log("DisplayId is ", p.displayId);
                    $.ajax({
                        type: 'POST',
                        url: p.popUrl,
                        data: {
                            displayId: p.displayId,
                            pop: batch
                        }
                    }).done(
                        function (data) {
                            JL().debug("Done: Proof of play data successfully sent.\n\n");
                            console.log("Done: Proof of play data successfully sent.");
                            localforage.getItem('pop').then(function(pop) {
                                var b = pop.splice(batch.length, pop.length);
                                localforage.setItem('pop', b);
                            });
                        }
                    ).error(
                        function (jqXHR, textStatus, errorThrown) {
                            console.log("POP Error.");
                            JL().debug(textStatus);
                            JL().debug(jqXHR);
                            JL().debug("There was an issue sending POP data to the server.");
                        }
                    );
                } else {
                    console.log("POP not sent. We are offline.");
                }
            });
        });
    };

    my.filterPop = function () {
        return localforage.getItem('pop').then(function(v) {
            if (v === null) {
                return;
            }
            // Foreach POP if displayId doesn't match current, discard. Removes any left over from testing.
            for (var i in v) {
                if (v[i].displayId !== p.displayId) {
                    JL().debug("Current Display is " + p.displayId + " and POP display is " + v[i].displayId + ", discarding.");
                    v.splice(i, 1);
                }
            }
            localforage.setItem('pop', v);
        });
    };
    return my;
}(player));