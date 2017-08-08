player.pop = (function(p) {
    var my = {};

    my.add = function (presId, coid, version) {
        var pop = [];
        console.log("Proof of play: "+presId+" v: "+version);
        localforage.getItem('pop').then(function(v){
            if (v === null) {
                pop = [];
                var now = new Date();
                pop.push({'displayId': p.displayId, 'coid': coid, 'time': (now.getTime() / 1000), 'duration': p.param[0].cr, 'presId': presId, 'version': version});
                localforage.setItem('pop', pop);
            } else {
                pop = v;
                var now = new Date();
                pop.push({'displayId': p.displayId, 'coid': coid, 'time': (now.getTime() / 1000), 'duration': p.param[0].cr, 'presId': presId, 'version': version});
                localforage.setItem('pop', pop);
            }
        });

    };

    my.send = function() {
        JL().debug("Sending POP.");
        localforage.getItem('pop').then(function(v) {
            if (v === null) {return;}
            // Foreach POP if displayId doesn't match current, discard. Removes any left over from testing.
            var totalRecords = v.length;
            for (var i in v) {
                if (v[i].displayId !== p.displayId) {
                    JL().debug("Current Display is "+p.displayId+" and POP display is "+v[i].displayId+", discarding.");
                    v.splice(i, 1);
                }
            }

            if (v.length > 200) {
                var batch = v.splice(0, 200);
            } else {
                var batch = v;
            }

            if (my.online) {
                JL().debug("POP records: "+totalRecords+". Sending: "+batch.length+".");
                console.log("batch", batch);
                $.ajax({
                    type: 'POST',
                    url: p.popUrl,
                    data: {
                        pop: batch
                    }
                }).done(
                    function (data) {
                        JL().debug("Done: Proof of play data successfully sent.\n\n");
                        localforage.getItem('pop').then(function(pop) {
                            var b = pop.splice(batch.length, pop.length);
                            localforage.setItem('pop', b);
                        });
                    }
                ).error(
                    function (jqXHR, textStatus, errorThrown) {
                        JL().debug(textStatus);
                        JL().debug(jqXHR);
                        JL().debug("There was an issue sending POP data to the server.");
                    }
                );
            }
        });
    };

    return my;
}(player));