var ajaxRequests = []

function addTable(doc, table) {
    var div = doc.getElementById("tables");
    div.appendChild(table);
}

function processSolutions(pb, solutions) {
    var doc = pb.ownerDocument;
    solutions = JSON.parse(solutions);
    if (solutions.errore !== null) {
        pb.innerHTML += "ERRORE: " + solutions.errore;
        return;
    }
    if (solutions.soluzioni.length === 0) {
        pb.innerHTML += "No solutions...";
        return;
    }
    for (var i = 0; i < Math.min(solutions.soluzioni.length, 7); ++i) {
        var table = doc.createElement("table");
        var timeRow = table.insertRow();
        timeRow.className = "time";
        var stationRow = table.insertRow();
        stationRow.className = "station";

        var solution = solutions.soluzioni[i];
        var duration = solution.durata;

        var durationCell = timeRow.insertCell();
        durationCell.className = "duration";
        durationCell.rowSpan = "2";
        durationCell.innerHTML = duration;

        for (var j = 0; j < solution.vehicles.length; ++j) {
            var p = solution.vehicles[j].orarioPartenza;
            var indexT = p.indexOf('T') + 1;
            var time = p.substring(indexT, indexT + 5);

            var timeCell = timeRow.insertCell();
            timeCell.innerHTML = time;

            var station = solution.vehicles[j].origine;
            var stationCell = stationRow.insertCell();
            stationCell.innerHTML = station;
            // Add destination time
            if (j == solution.vehicles.length - 1) {
                var a = solution.vehicles[j].orarioArrivo;
                var indexT = a.indexOf('T') + 1;
                var time = a.substring(indexT, indexT + 5);

                var timeCell = timeRow.insertCell();
                timeCell.innerHTML = time;

                var station = solution.vehicles[j].destinazione;
                var stationCell = stationRow.insertCell();
                stationCell.innerHTML = station;
            }
        }
        addTable(doc, table);
    }
}

function getLocalIsoTime(date = Date.now()) {
    var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    var localISOTime = (new Date(date - tzoffset)).toISOString().slice(0,-1);
    return localISOTime.replace(/\.[0-9]+$/, '');
}

function findStationCode(input, callback) {
    var req = $.ajax({
        url: 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/autocompletaStazione/' + encodeURI(input),
        method: 'get',
        dataType: 'text',
        success: function(response) {
            response = response.split("\n")[0];
            response = response.split("|");
            if (response[1].substring(0, 1) == 'S')
                response[1] = response[1].substring(1);
            callback(response);
        }
    });
    ajaxRequests.push(req);
}

function findTrainByCode(startStationCode, endStationCode, time, callback) {
    var req = $.ajax({
        url: 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/soluzioniViaggioNew/'
             + startStationCode + '/' + endStationCode + '/' + time,
        method: 'get',
        dataType: 'text',
        success: callback
    });
    ajaxRequests.push(req);
}

function findTrain(pb, guessStart, guessEnd, time, callback) {
    findStationCode(guessStart, function(start) {
        pb.ownerDocument.getElementById("start").innerHTML = start[0] + "(" + start[1] + ")";
        findStationCode(guessEnd, function(end) {
            pb.ownerDocument.getElementById("end").innerHTML = end[0] + "(" + end[1] + ")";
            findTrainByCode(start[1], end[1], time, function(result) {
                  callback(pb, result);
            });
        })
    })
}

CmdUtils.CreateCommand({
    names: ["train"],
    description: "A short description of your command.",
    help: "How to use your command.",
    author: {
        name: "Svalorzen",
        email: "svalorzen@gmail.com",
    },
    license: "GPL",
    homepage: "http://ubiquity.mozilla.com/",
    icon: "http://www.mozilla.com/favicon.ico",
    arguments: [
        {role: "object", nountype: noun_arb_text, label: "source"},
        {role: "goal",   nountype: noun_arb_text, label: "destination"},
        {role: "time", nountype: noun_type_time, label: "time"}
    ],
    execute: function execute(args) {
        displayMessage("Your input: " + args.object.text, this);
    },
    preview: function preview(pblock, args) {
        var from = args.object.text;
        var goal = args.goal.text;
        var time = getLocalIsoTime(args.time.data);
        if (from === "" || goal === "")
            return;

        while (ajaxRequests.length > 0) {
            var req = ajaxRequests.pop();
            req.abort();
        }

        var doc = pblock.ownerDocument;
        doc.getElementById("tables").innerHTML = "";
        doc.getElementById("start").innerHTML = "";
        doc.getElementById("end").innerHTML = "";
        doc.getElementById("time").innerHTML = time;

        // MAGIE
        findTrain(pblock, from, goal, time, processSolutions);
    },
    previewUrl:
    'data:text/html,<head><meta charset=UTF-8>'+
    '<style>table{border-collapse:collapse;color:white}' +
    'tr{text-align:center}' +
    'td{border:5px solid %23809fff;border-radius:15px;font-family:"Courier New",Courier,monospace}' +
    'p{font-size: 20px;font-family:"Courier New",Courier,monospace;color: white}' +
    'b{background-color: dimgray;border: 3px solid black;border-radius: 7px;}' +
    '.duration{background:darkblue}' +
    '.time{background:%23809fff}' +
    '.station{background:%23e6ffe6;color:black}' +
    '</style></head>' +
    '<p>Trains from <b id="start"></b> to <b id="end"></b> at <b id="time"></b></p>' +
    '<div id="tables"/>'
});
