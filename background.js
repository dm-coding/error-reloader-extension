/** Set defaults **/
status_codes = [324, 408, 502, 503, 504, 522, 524, 598, 599];
socket_errors = ["net::ERR_ABORTED", "net::ERR_BLOCKED_BY_CLIENT"];
ignore_types = ["stylesheet", "script", "image", "xmlhttprequest"];
enabled = true;
wait_timer = 3000; // ms (3 seconds before page reloads)
chrome.browserAction.setBadgeText({text: "ON"});

tab_list = {};

function incrementTabCounter(tabId) {
	if (tab_list[tabId]) {
		tab_list[tabId] = tab_list[tabId] + 1;
	} else {
		tab_list[tabId] = 1;
	}
	return tab_list[tabId];
}

function reloadTab(tabId) {
	if (tabId > -1) {
		console.log("Reloading..");
		chrome.browserAction.setBadgeText({text: ""+incrementTabCounter(tabId)+""});
		chrome.tabs.reload(tabId);
	}
}

function in_array(needle, haystack) {
	if (haystack.indexOf(needle)==-1) {
		return false;
	}
	return true;
}

/** Deal with cases in which the browser receives a page
with a valid HTTP status code. **/
chrome.webRequest.onHeadersReceived.addListener(
	function(details) {
		if(enabled) {
			var http_status_code = parseInt(details.statusLine.split(" ")[1]);
			if ((status_codes.indexOf(http_status_code) > -1) && (ignore_types.indexOf(details.type)==-1)) {
				console.log("Reloader: Tab ID #" + details.tabId + " (" + details.url + "): " + details.statusLine);
				setTimeout(function() {reloadTab(details.tabId);}, wait_timer);
			}
		}
	},
	{urls: ["*://*/*"]},
	["responseHeaders"]
);


/** Deal with cases where the page did not load fully (e.g.
a low-level socket error. In these cases, an error is fired.)**/
chrome.webRequest.onErrorOccurred.addListener(
	function(details) {
		if(enabled) {
			console.log("Reloader: Tab ID #" + details.tabId + " (" + details.url + ") failed to load: " + details.error);
			if ((socket_errors.indexOf(details.error)==-1) && (ignore_types.indexOf(details.type)==-1)) {
				setTimeout(function() {reloadTab(details.tabId);}, wait_timer);
			}
		}
	},
	{urls: ["*://*/*"]}
);


/** Allow the extension to be toggled at will **/
chrome.browserAction.onClicked.addListener(function() {
	if (enabled) {
		enabled = false;
		alert("Reloader disabled");
		chrome.browserAction.setBadgeText({text: "OFF"});
	} else {
		enabled = true;
		alert("Reloader enabled");
		chrome.browserAction.setBadgeText({text: "ON"});
	}
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.browserAction.setBadgeText({text: ""});
	if(tab_list[activeInfo.tabId]) {
		chrome.browserAction.setBadgeText({text: ""+tab_list[activeInfo.tabId]+""});
	} else {
		if (enabled) {
			chrome.browserAction.setBadgeText({text: "ON"});
		} else {
			chrome.browserAction.setBadgeText({text: "OFF"});
		}		
	}
});