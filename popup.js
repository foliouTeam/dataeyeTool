// Copyright (c) 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This extension demonstrates using chrome.downloads.download() to
// download URLs.

var allLinks = [];
var visibleLinks = [];

// Display all visible links.
function showLinks() {
    var linksTable = document.getElementById("links");
    while (linksTable.children.length > 1) {
        linksTable.removeChild(linksTable.children[linksTable.children.length - 1]);
    }
    for (var i = 0; i < visibleLinks.length; ++i) {
        var row = document.createElement("tr");
        var col0 = document.createElement("td");
        var col1 = document.createElement("td");
        var checkbox = document.createElement("input");
        checkbox.checked = true;
        checkbox.type = "checkbox";
        checkbox.id = "check" + i;
        col0.appendChild(checkbox);
        col1.innerText = visibleLinks[i]["title"];
        col1.style.whiteSpace = "nowrap";
        col1.onclick = function() {
            checkbox.checked = !checkbox.checked;
        };
        row.appendChild(col0);
        row.appendChild(col1);
        linksTable.appendChild(row);
    }
}

// Toggle the checked state of all visible links.
function toggleAll() {
    var checked = document.getElementById("toggle_all").checked;
    for (var i = 0; i < visibleLinks.length; ++i) {
        document.getElementById("check" + i).checked = checked;
    }
}

// Download all visible checked links.
function downloadCheckedLinks() {
    for (var i = 0; i < visibleLinks.length; ++i) {
        if (document.getElementById("check" + i).checked) {
            //alert("download" + visibleLinks[i]["url"]);
            try {
                chrome.downloads.download({ url: visibleLinks[i]["url"], filename: visibleLinks[i]["title"] + ".mp4" }, function(id) {
                    //alert(id);
                });
            } catch (error) {
                //alert(error);
            }
        }
    }
    //window.close();
}

// Re-filter allLinks into visibleLinks and reshow visibleLinks.
function filterLinks() {
    var filterValue = document.getElementById("filter").value;
    if (document.getElementById("regex").checked) {
        visibleLinks = allLinks.filter(function(link) {
            return link.match(filterValue);
        });
    } else {
        var terms = filterValue.split(" ");
        visibleLinks = allLinks.filter(function(link) {
            for (var termI = 0; termI < terms.length; ++termI) {
                var term = terms[termI];
                if (term.length != 0) {
                    var expected = term[0] != "-";
                    if (!expected) {
                        term = term.substr(1);
                        if (term.length == 0) {
                            continue;
                        }
                    }
                    var found = -1 !== link.indexOf(term);
                    if (found != expected) {
                        return false;
                    }
                }
            }
            return true;
        });
    }
    showLinks();
}

// Add links to allLinks and visibleLinks, sort and show them.  send_links.js is
// injected into all frames of the active tab, so this listener may be called
// multiple times.

if (false) {
	
	document.getElementById("loading").innerHTML = "页面中无可下载视频";
} else {
    chrome.extension.onRequest.addListener(function(links) {
        if (!links || links.length == 0) {
            document.getElementById("loading").innerHTML = "页面中无可下载视频";
            return;
        }
        var copyhtml = "";
        for (var i in links) {
            copyhtml += links[i]["url"] + "\n";
        }
        document.getElementById("bar").innerHTML = copyhtml;
        document.getElementById("loading").style.display = "none";
        for (var index in links) {
            allLinks.push(links[index]);
        }
        allLinks.sort();
        visibleLinks = allLinks;
        showLinks();
        document.getElementById("result_wrap").style.display = "block";
    });

    // Set up event handlers and inject send_links.js into all frames in the active
    // tab.
    window.onload = function() {
        document.getElementById("filter").onkeyup = filterLinks;
        document.getElementById("regex").onchange = filterLinks;
        document.getElementById("toggle_all").onchange = toggleAll;
        document.getElementById("download0").onclick = downloadCheckedLinks;
        document.getElementById("download1").onclick = downloadCheckedLinks;
        var clipboard = new ClipboardJS(".btn");
        clipboard.on("success", function(e) {
            alert("复制成功");
        });
        chrome.windows.getCurrent(function(currentWindow) {
            chrome.tabs.query({ active: true, windowId: currentWindow.id }, function(activeTabs) {
                chrome.tabs.executeScript(activeTabs[0].id, { file: "send_links.js", allFrames: true });
            });
        });
    };
}
