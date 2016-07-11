<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<title>Ubiquity Web Search Commands</title>
<link rel="commands" href="search.xhtml"/>
</head>
<style>
    div[id] {display: none}
    script {display: block; white-space: pre; font-family: monospace}
</style>
<body>
<p>This XHTML feed contains commands for searching the Web.</p>
<div id="map-css">
    body {margin:0; padding:0}
    <!-- Buttons are Copy and Paste -->
    #buttons {position:absolute; top:4px; left:100px; opacity:0.8}
    #buttons > input {font:bold small monospace; padding:0}

    .adp-listsel {color:#fff !important; background-color:#666 !important}
    .adp-list {color:#ddd !important; background-color:#333 !important}
    .adp-list td {font-size:88%}
    .adp-placemark {
        color:#eee !important; background-color:#555 !important; font-size:112%;
    }
    .adp-summary, .adp-directions {color:#ccc; font-size:96%}
    .adp-listheader, .adp-legal {display:none}
    <!-- addrs is the list of addresses/no search results -->
    #addrs {
        max-width: 40%;
        position: absolute; bottom: 15px; right: 40px; z-index: 5;
        background-color: #000; opacity: 0.666; font-size: 76%;
        border-radius: 8px;
    }
    #addrs > p {display:block; text-decoration:none; color:#ccc}
    #addrs > a {display:block; text-decoration:none; color:#ccc}
    #addrs > a::before {
        content:attr(accesskey); margin-right:0.4em;
        font:bold monospace; text-decoration:underline
    }
    <!-- The active one is the one we are currently in -->
    #addrs > .active {color:#fff}
    #addrs > .active::before {text-decoration:none}
</div>

<script type="?" class="commands"><![CDATA[
var YOUR_API_KEY = 'YOUR_API_KEY';
const
MAPS = 'http://maps.googleapis.com/',
MAP_INIT = '!'+ function init([lat, lng, zoom, api]) {
    // Shortener
    self.maps = google.maps
    // Markers
    self.markers = []
    self.API_KEY = api
    // Creates the Map
    self.M = new maps.Map(document.getElementById('map'), {
        center: new maps.LatLng(lat, lng),
        mapTypeId: maps.MapTypeId.ROADMAP,
        zoom: zoom || 12,
        scaleControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: maps.MapTypeControlStyle.DROPDOWN_MENU,
        },
    })
    addEventListener('go', function mapdo(e){
        maptie(document.getElementById('buttons'), mapkey)

        var data = JSON.parse(e.data)
        if(!data.q) return;

        // Addrs will contain our matches
        var addrs = document.getElementById('addrs')

        // Parse input
        if (!data.q.endsWith("||")) return;
        var locations = data.q.slice(0, -2).split("|");
        // Cleaning..
        addrs.innerHTML = ''
        for(var i=0; i < markers.length; i++){
            markers[i].setMap(null);
        }
        markers = []
        // GEOCODING
        var geocoder = new maps.Geocoder();
        for (var i = 0; i < locations.length; i++) {
            if (locations[i] === "") continue;
            (function (i) {
            geocoder.geocode({'address' : locations[i].toLowerCase()}, function(rs, status){
                if (status != google.maps.GeocoderStatus.OK) {
                    let p = document.createElement('p');
                    p.innerHTML = (i+1) + ' Error: <b></b>'
                    p.firstElementChild.textContent = status;
                    addrs.appendChild(p);
                }
                else if (!rs.length) {
                    let p = document.createElement('p');
                    p.innerHTML = (i+1) + ' No results for <b></b>'
                    p.firstElementChild.textContent = locations[i];
                    addrs.appendChild(p);
                } else {
                    let a = document.createElement('a')
                    a.href = 'javascript:'
                    a.value = i
                    a.accessKey = -~i % 10
                    a.textContent = rs[0].formatted_address
                    a.onclick = function(e) {
                        if(e) e.stopPropagation()
                        M.panTo(rs[0].geometry.location);
                        // Selects the active one so it's white.
                        (this.parentNode.querySelector('.active') || 0).className = '';
                        this.className = 'active'
                    }
                    addrs.appendChild(a)
                    // We also add a marker
                    M.setCenter(rs[0].geometry.location);
                    var marker = new google.maps.Marker({
                        map: M,
                        position: rs[0].geometry.location
                    });
                    markers.push(marker);
                }
            }) // END DECODING
        })(i)}
        // Function tied to the map buttons we added
        function mapkey(e){
            var {body} = document;
            var k = e.target.accessKey.toLowerCase();
            // Avoid that the click event goes on (we capture it).
            e.preventDefault()
            // Creates a static image of the displayed map
            var markerStrings = [];
            for(var i=0; i < markers.length; i++){
                var p = markers[i].getPosition();
                markerStrings.push('&markers=' + p.lat() + ',' + p.lng());
            }
            var u =
                'https://maps.googleapis.com/maps/api/staticmap' +
                '?key=' + API_KEY +
                '&maptype='+ M.getMapTypeId() +
                '&center='+ M.getCenter().toUrlValue() +
                '&zoom='+ M.getZoom() +
                '&size='+ body.clientWidth +'x'+ body.clientHeight +
                markerStrings.join('');
            // Sends the url back to the command so it can do stuff.
            mapact(k, u);
        }
    }, false)
    // Ties the mapkey action to all buttons (copy|paste)
    function maptie(it, fn){
        'tied' in it || it.addEventListener('click', fn, it.tied = true)
    }
    // Sends a message back to the command.
    function mapact(key, url){
        dispatchEvent(new MessageEvent('action', {
            // Creates the Map
            data: url || '',
            origin: '*',
            lastEventId: key || '',
            source: self,
        }))
    }
}

// Default map position
{   let loc = CmdUtils.geoLocation
    var gCoords = {
        lat: loc ? loc.lat : 180 * Math.random() -  90,
        lon: loc ? loc.lon : 360 * Math.random() - 180,
    }
}

CmdUtils.CreateCommand({
    names: ['manymap'],
    description: 'Explores '+ 'Google Maps'.link(MAPS) +'.',
    help: (
            '<b>[ accesskeys ]</b><pre style="line-height:1.5">'+
            ['R/S     : Roadmap / Satellite',
            'H/J/K/L : \u2190 / \u2193 / \u2191 / \u2192',
            'P/M     : + / -',
            'C/V     : Copy / Insert'].join('\n') +
            '</pre>'
          ).replace(/\b[A-Z]\b/g, '$&'.bold()),
    icon: 'chrome://ubiquity/skin/icons/google.ico',
    arguments: [{role: "object", nountype: noun_arb_text, label: "locations"}],
    execute: function execute(args) {},
    preview: function preview(pb, args) {
        var doc = pb.ownerDocument
        // If missing, we create the code that does the stuff.
        if(!doc.getElementById('init')){
            let div = doc.createElement('div'), script = doc.createElement('script')
            // Buttons for copy/paste
            div.innerHTML =
            '<style id="init">' +
                feed.dom.getElementById("map-css").textContent +
            '</style>' +
            '<div id="buttons">'+
                '<input type="button" accesskey="c" value="(C)opy">' +
                '<input type="button" accesskey="v" value="Insert (V)">' +
            '</div>'
            pb.appendChild(div)
            // Script that does the things
            script.type = 'application/javascript;version=1.8'
            // We init the map with our coords
            script.innerHTML = MAP_INIT + '('+ uneval([gCoords.lat, gCoords.lon, 12, YOUR_API_KEY]) +')'
            pb.appendChild(script)
        }
        var win = doc.defaultView
        // Sends lookup event to map.
        win.dispatchEvent(new win.MessageEvent('go', {
            data: JSON.stringify({
                q: args.object.text
            }),
            origin: '*',
            source: win,
        }))
        // Attaches action event to our receiver.
        win.addEventListener('action', this._act, false)
        this._act.me = this
    },
    // Stuff on top, loads google api, adds addrs
    previewUrl:
    'data:text/html,<head><meta charset=UTF-8>'+
    '<script src="'+ MAPS + 'maps/api/js?key=' + YOUR_API_KEY + '"></script></head>'+
    '<div id=map style="width:100%;height:100%"></div>'+
    '<div id=addrs></div>',
    // Stuff to do after we receive a message from the buttons on the map.
    _act: function map_act(e){
        var url = e.data
        displayMessage("Event", map_act.me);
        // Needed otherwise pasted maps get erased
        if(url){
            let img = '<img src="'+ Utils.escapeHtml(url) +'"/>'
            if (e.lastEventId === 'c') {
                Utils.clipboard.set({text: url, html: img});
                displayMessage("Copied image", map_act.me);
            } else
                CmdUtils.setSelection(img, {text: url});
        }
    },
})

]]></script>
</body>
</html>
