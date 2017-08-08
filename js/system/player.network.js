player.network = (function(p) {
    var my = {};
    my.timeouts;
    my.online;

    my.check = function(url) {
        return $.get(url, function(){
            JL().debug("Network.Check: We are online.");
            console.log("Network.Check: We are online.");
            p.online = true;
        }).fail(function(jqXHR, exception) {
            JL().fatalException("Network.Check: We are offline.", jqXHR);
            console.log("Network.Check: We are offline.");
            p.online = false;
        });
    };

    return my;
}(player));