/** Set defaults **/
status_codes = [324, 408, 502, 503, 504, 522, 524, 598, 599];
socket_errors = ["net::ERR_ABORTED"];
ignore_types = ["stylesheet", "script", "image", "xmlhttprequest"];
enabled = true;
wait_timer = 3000; // ms (3 seconds before page reloads)

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
		chrome.browserAction.setIcon({path:"icons/reloader-disabled.png"});
		chrome.browserAction.setTitle({ "title": "Enable Error Reloader"});
	} else {
		enabled = true;
		chrome.browserAction.setIcon({path:"icons/reloader-19.png"});
		chrome.browserAction.setTitle({ "title": "Disable Error Reloader"});
	}
});

/** Sets the icon badge text for the extension to be the
number of times the current tab has been reloaded, if it has been reloaded
at all.**/
chrome.tabs.onActivated.addListener(function(activeInfo) {
	if(tab_list[activeInfo.tabId]) {
		chrome.browserAction.setBadgeText({text: ""+tab_list[activeInfo.tabId]+""});
	}
});