player.fonts = (function (p) {
    var my = {};

    my.configure = function() {
        // Create font holders -
        var fonts = ['bebas_neueregular', 'league_gothicregular', 'molotregular', 'paloaltoheavy', 'passion_onebold', 'amaranthregular',
            'walkway_semiboldregular', 'existencelight', 'caviar_dreamsregular', 'ralewayregular', 'quicksandregular', 'pacificoregular',
            'lobster_tworegular', 'lobster_1.3regular', 'kaushan_scriptregular', 'blackjackregular', 'dancing_script_otregular', 'jenna_sueregular',
            'journalregular', 'snicklesregular', 'gooddogregular', 'jemnewromanmedium', 'chronicles_of_a_heroregular', 'architects_daughterregular',
            'amaranthregular', 'aurulent_sansregular', 'arsenalregular', 'allerregular', 'ambleregular', 'andika_basicregular', 'junction_regularregular',
            'share-regularregular', 'folksregular', 'familiar_probold', 'latoregular', 'overpassregular', 'candelabook', 'robotomedium', 'source_sans_proregular',
            'droid_sansregular', 'exoregular', 'jargon_brknormal', 'distant_galaxyregular', 'orbitronregular', 'digital_dream_fatregular', 'magentaregular',
            'chumbly_brknormal', 'belligerent_madnessregular', 'yesterdays_mealregular', 'no_consequenceregular', 'scratchregular', 'boston_trafficregular',
            'capture_itregular', 'asap', 'boogaloo', 'autour_one', 'vanilla'];
        $.each(fonts, function(i, v){
            $('#fontContainer').append('<p style="font-family: '+v+'">a</p>');
        });
        console.log("Fonts configured");
    };

    return my;
}(player));