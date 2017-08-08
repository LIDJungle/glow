<!DOCTYPE html>
<html>
<head>
</head>
<style>
    .preview-holder {
        margin-left: 2.5%;
        margin-top: 50px;
        height: 300px;
        width: 300px;
        opacity: 1;
        position: absolute;
    }
    .preview-overlay {
        width: 100%;
        height: 100%;
        /*
        Striped Gray
        background-image: repeating-linear-gradient(
            135deg,
            #CCCCCC,
            #CCCCCC 10px,
            #999999 10px,
            #999999 20px
        );
        opacity: .75;
        */
        background: linear-gradient(to bottom, #7db9e8 0%,#1e5799 4%,#1e5799 4%,#376499 13%,#2989d8 19%,#2989d8 23%,#8db6ef 32%,#2989d8 47%,#2989d8 47%,#1e5799 66%,#000000 70%,#76c46a 74%,#2e6d15 99%);
        position: absolute;
    }
    #playerClose {
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
    }
    #crateSelect {
        position: absolute;
        top: 10px;
        left: 10px;
        width: 200px;
        height: 32px;
    }
    #statusLeft {
        position: absolute;
        bottom: 10px;
        left: 10px;
        color: white;
    }
    #statusRight {
        position: absolute;
        bottom: 10px;
        right: 10px;
        color: white;
    }
</style>
<!--<script src="/glow/js/jquery.min.js"></script>-->
<script src="/glow/js/localforage.min.js"></script>
<script>
    $(document).ready(function(e) {
        console.log("Config preview div");
        var browserWidth = $(window).width();
        var browserHeight = $(window).height();
        var divWidth = Math.floor(browserWidth * .95);
        var divHeight = Math.floor(divWidth * .6);
        console.log("Browser Width: "+browserWidth+", Browser Height: "+browserHeight);
        $('.preview-holder').css('width', divWidth);
        $('.preview-holder').css('height', divHeight);
        //var id = get_var('id');
        var id = <?php echo $_POST['id']; ?>;
        var mode = '<?php echo $_POST['mode']; ?>';
        var crate = '<?php echo $_POST['cr']; ?>';
        var h = '<?php echo $_POST['h']; ?>';
        var w = '<?php echo $_POST['w']; ?>';
        var items = '<?php echo $_POST['items']; ?>';
        console.log("items", items);
        if (crate > 20) {crate = 10;}
        $('#crateSelect').val(crate);
        setCrate();
        console.log("Frame id is: "+id);
        $('#iframe').attr('src','/glow/index.php?id='+id+'&mode='+mode+'&crate='+crate+'&h='+h+'&w='+w+'&items='+items);
    });
    function closeWindow() {
        $("#previewer").remove();
    }
    function setCrate() {
        localforage.getItem('param').then(function(param){
            if (param === null) {

            } else {
                param[0].cr = $('#crateSelect').val();
                localforage.setItem('param', param);
            }
        });
    }
</script>

</head>
<body style="background-color: white; color: white; margin: 0;">
<div class="preview-overlay">

</div>
    <div class="preview-holder">
        <!--
    We need to add a "close" button to the overlay.
    We need to add a change rate select box.
    -->
        <img src="/glow/img/close.png" onclick="closeWindow()" id="playerClose">
        <select id="crateSelect" onchange="setCrate()">
            <option value="2">2 seconds</option>
            <option value="3">3 seconds</option>
            <option value="4">4 seconds</option>
            <option value="5">5 seconds</option>
            <option value="6">6 seconds</option>
            <option value="7">7 seconds</option>
            <option value="8">8 seconds</option>
            <option value="9">9 seconds</option>
            <option value="10">10 seconds</option>
            <option value="11">11 seconds</option>
            <option value="12">12 seconds</option>
            <option value="13">13 seconds</option>
            <option value="14">14 seconds</option>
            <option value="15">15 seconds</option>
            <option value="16">16 seconds</option>
            <option value="17">17 seconds</option>
            <option value="18">18 seconds</option>
            <option value="19">19 seconds</option>
            <option value="20">20 seconds</option>
        </select>
        <div id="statusLeft">&nbsp;</div>
        <div id="statusRight">&nbsp;</div>
        <iframe id="iframe" style="width: 100%; height: 100%" />
        <div style="clear: both;"></div>
    </div>

</body>

</html>
