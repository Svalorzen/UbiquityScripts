function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

CmdUtils.CreateCommand({
  names: ["grep"],
  description: "Search and list result.",
  help: "Search for text, use *** for word wildcard, ___ for general wildcard.",
  icon: "chrome://ubiquity/skin/icons/search.png",
  author: {
    name: "Svalorzen",
    email: "svalorzen@gmail.com",
  },
  license: "GPL",
  homepage: "http://ubiquity.mozilla.com/",
  arguments: [{role: "object", nountype: noun_arb_text, label: "pattern"}],
  execute: function execute(args) {
    var search = args.object.text;
    if (search.match(/^\s*$/)) {
        pblock.innerHTML = "";
        return;
    }
    search = search.replace("***", "\\b(\\w*)\\b");
    search = search.replace("___", "\\b(.*)\\b");
    var document = CmdUtils.getDocument();
    var text = document.documentElement.innerText;
    var regex = new RegExp(search, "gi");
    var matches = [];
    var match;
    var counter = 50;
    while ((counter-- > 0) && (match = regex.exec(text))) {
        if (match.length == 1)
            match = match[0];
        else
            match = match[1];
        if (match != "")
            matches.push(match);
    }
    matches = matches.filter(onlyUnique);
    CmdUtils.copyToClipboard(matches.join("|"));
  },
  preview: function preview(pblock, args) {
    var search = args.object.text;
    if (search.match(/^\s*$/)) {
        pblock.innerHTML = "";
        return;
    }
    search = search.replace("***", "\\b(\\w*)\\b");
    search = search.replace("___", "\\b(.*)\\b");
    var document = CmdUtils.getDocument();
    var text = document.documentElement.innerText;
    var regex = new RegExp(search, "gi");
    var matches = [];
    var match;
    var counter = 50;
    while ((counter-- > 0) && (match = regex.exec(text))) {
        if (match.length == 1)
            match = match[0];
        else
            match = match[1];
        if (match != "")
            matches.push(match);
    }
    if (matches.length == 0) {
        pblock.innerHTML = "No matches."
        return;
    }
    matches = matches.filter(onlyUnique);
    pblock.innerHTML = matches.join("<br>");
  },
});
