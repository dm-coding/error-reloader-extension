/** Set defaults **/
/** Errors are taken directly from Chromium source code macro at 
https://src.chromium.org/viewvc/chrome/trunk/src/net/base/net_error_list.h
Not all error codes are guaranteed to be applicable or correct - it is an assumed
list based on expected behaviour.
However, the following codes *have* been observed in the wild and should make their way into
most future versions of this program:
	"net::ERR_EMPTY_RESPONSE", "net::ERR_ADDRESS_UNREACHABLE", "net::ERR_INVALID_RESPONSE", "net::ERR_CONTENT_LENGTH_MISMATCH",
	"net::ERR_CONNECTION_RESET"
The following codes are also highly likely to be relevant:
	"net::ERR_CONNECTION_REFUSED", "net::ERR_CONNECTION_ABORTED", "net::ERR_CONNECTION_FAILED",
	"net::ERR_TIMED_OUT", "net::ERR_CONNECTION_TIMED_OUT"
*/
var status_codes = [324, 408, 502, 503, 504, 522, 524, 598, 599],
	socket_errors = ["net::ERR_ABORTED", "net::ERR_EMPTY_RESPONSE", "net::ERR_TIMED_OUT", 
		"net::ERR_IO_PENDING", "net::ERR_NETWORK_CHANGED", "net::ERR_CONNECTION_CLOSED", "net::ERR_CONNECTION_RESET",
		"net::ERR_CONNECTION_REFUSED", "net::ERR_CONNECTION_ABORTED", "net::ERR_CONNECTION_FAILED", "net::ERR_INTERNET_DISCONNECTED",
		"net::ERR_ADDRESS_UNREACHABLE", "net::ERR_TUNNEL_CONNECTION_FAILED", "net::ERR_RENOGITIATION_REQUESTED", 
		"net::ERR_CONNECTION_TIMED_OUT", "net:ERR_HOST_RESOLVER_QUEUE_TOO_LARGE", "net::ERR_SOCKS_CONNECTION_FAILED", 
		"net::ERR_SOCKS_CONNECTION_HOST_UNREACHABLE", "net::ERR_PROXY_CONNECTION_FAILED", "net::ERR_NAME_RESOLUTION_FAILED",
		"net::ERR_TEMPORARILY_THROTTLED", "net::ERR_WS_PROTOCOL_ERROR", "net::ERR_SSL_HANDSHAKE_NOT_COMPLETED", "net::ERR_WS_THROTTLE_QUEUE_TOO_LARGE",
		"net::ERR_TOO_MANY_SOCKET_STREAMS", "net::ERR_INVALID_RESPONSE", "net::ERR_INVALID_SPDY_STREAM", "net::ERR_INCOMPLETE_SPDY_HEADERS",
		"net::ERR_SPDY_PING_FAILED", "net::ERR_CONTENT_LENGTH_MISMATCH", "net::ERR_RESPONSE_HEADERS_TRUNCATED",
		"net::ERR_QUIC_HANDSHAKE_FAILED", "net::ERR_FTP_TRANSFER_ABORTED", "net::ERR_FTP_FILE_BUSY", "net::ERR_FTP_BAD_COMMAND_SEQUENCE",
		"net::ERR_FTP_SYNTAX_ERROR", "net::ERR_DNS_MALFORMED_RESPONSE", "net::ERR_DNS_SERVER_FAILED", "net::ERR_DNS_TIMED_OUT", "net::ERR_DNS_SERVER_FAILED",
		"net::ERR_NAME_NOT_RESOLVED"
	],
	asset_types = ["stylesheet", "script", "image"],
	enabled = true,
	wait_timer = 3000, // ms (3 seconds before page reloads)
	asset_list = {}; // here we store each asset which has been loaded along with the number of times this has happened.

/** Convenience function to detect if array contains a value **/
function in_array(needle, haystack) {
	if (haystack.indexOf(needle)===-1) {
		return false;
	}
	return true;
}

/** Reloads a specific page (by tab ID) **/
function reloadTab(tabId, url) {
	if (tabId > -1) {
		count = incrementCounter(asset_list, url);
		chrome.tabs.query({active: true}, function(tab) {
			if ((tabId == tab.id) || (count > 99)) {
				chrome.browserAction.setBadgeText({text: count.toString() });
			} else {
				chrome.browserAction.setBadgeText({text: "+" + count});
			}
		});
		chrome.tabs.reload(tabId);
	}
}

/** Reloads a specific asset by URL without reloading the entire page.
HOW IT WORKS: When an image (and presumably stylesheet and javascript) resource's src (URL) is changed
the asset is automaticly reloaded by the browser. Since we've detected an error event, all we need to do
is change the URL and the asset automaticly reloads. We do that by adding the error_reloader_extension_reloaded
query to the URL part, e.g. http://src.url?error_reloader_extension_reloaded=0. The number in this case is the reload counter
though it may as well be random.
Special thanks to Muhammad Ubaid Raza (mubaidr) for his inspiration for this function without which
inline asset reloading would not be possible. **/
function reloadAsset(details) {
	uri = URI(details.url);
	// We'll be checking the asset list against the details.url. If it was already loaded, we need to remove our counter in order
	// so that the asset counter doesn't get confused.
	//if (uri.hasQuery("error_reloader_extension_reloaded")) {
	//	uri.removeQuery("error_reloader_extension_reloaded");
	//}
	// Now we've normalised the URL into what it was before error reloader started, let's look up the reload count, increment it,
	// and use it to change that URL.
/*	new_url = uri.addQuery({ 
		error_reloader_extension_reloaded: incrementCounter(asset_list, uri.toString())
	}).toString();*/

	new_url = uri.addQuery({ 
		error_reloader_extension_reloaded: incrementCounter(asset_list, uri.removeQuery("error_reloader_extension_reloaded").toString())
	}).toString();

	// Now we have the new URL and the old URL we'll use them both with an injected content script to change the resource locations.
	if (details.type==="image") {
		attributeName = 'src';
		tagName = 'img';		
	} else if (details.type==="script") {
		attributeName = 'src';
		tagName = 'script';
	}  else if (details.type==="inline") {
		attributeName = 'src';
		tagName = 'iframe';
	}  else {
		attributeName = "href";
		tagName = "link";
	}
	chrome.tabs.executeScript(details.tabID, { code: 'function searchNodes(elements) {'+
'				for (var i = 0; i < elements.length; i++) {'+
'					if (elements[i].' + attributeName + '==="'+ details.url +'") {'+
'						elements[i].' + attributeName + ' = "'+ new_url + '";'+
'					}'+
'				}'+
'			}'+
'			searchNodes(document.getElementsByTagName("' + tagName + '"));'
	});
}

/** alternative - untested
if (!inIndex(needle, index)) {
	index[needle]=1;
} else {
	i1=i2=1;
	while (i2 < index[needle]) {
		i2=i1+i2;
		i1=i2;
	}
	index[needle]=i2;
}*/
function incrementCounter(index, assetID) {
	if (index[assetID]) {
		index[assetID] = index[assetID] + 1;
	} else {
		index[assetID] = 1;
	}
	return index[assetID];
}


/** Deal with cases in which the browser receives a page
with a valid HTTP status code. **/
chrome.webRequest.onHeadersReceived.addListener(
	function(details) {
		if(enabled) {
			var http_status_code = parseInt(details.statusLine.split(" ")[1]);
			if (in_array(http_status_code, status_codes)) {
				if(details.type === "main_frame") {
					console.log("Reloader: Tab ID #" + details.tabId + " (" + details.url + "): " + details.statusLine);
					setTimeout(function() { reloadTab(details.tabId, details.url); }, wait_timer);
				} else /*if (in_array(details.type, asset_types))*/ {
					console.log("Reloader Page Resource: Tab ID #" + details.tabId + " (" + details.url + "): " + details.statusLine);
					setTimeout(function() { reloadAsset(details); }, wait_timer);
				}
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
			if (in_array(details.error, socket_errors)) {
				if (details.type === "main_frame") {
					console.log("Reloader: Tab ID #" + details.tabId + " (" + details.url + ") encountered socket error: " + details.error);
					setTimeout(function() { reloadTab(details.tabId, details.url); }, wait_timer);				
				} else if (in_array(details.type, asset_types)) {
					console.log("Reloader Page Resource: Tab ID #" + details.tabId + " (" + details.url + "): " + details.error);
					setTimeout(function() { reloadAsset(details); }, wait_timer);
				}
			}
		}
	},
	{urls: ["*://*/*"]}
);


/** Allow the extension to be toggled at will. Turning off refreshes reload count. **/
chrome.browserAction.onClicked.addListener(function() {
	if (enabled) {
		enabled = false;
		chrome.browserAction.setIcon({path:"icons/reloader-disabled.png"});
		chrome.browserAction.setTitle({ "title": "Enable Error Reloader"});
		asset_list = {};
	} else {
		enabled = true;
		chrome.browserAction.setIcon({path:"icons/reloader-19.png"});
		chrome.browserAction.setTitle({ "title": "Disable Error Reloader"});
	}
});

/** Sets the icon badge text for the extension to be the
number of times the current page has been reloaded, if it has been reloaded
at all.**/
chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.query({active: true}, function(tab) {
		if (asset_list[tab.url]) {
			chrome.browserAction.setBadgeText({text: asset_list[tab.url].toString()});
		} else {
			chrome.browserAction.setBadgeText({text: ""});			
		}
	});
});

/*chrome.runtime.onInstalled.addListener(function () {
	chrome.storage.local.set({
		enabled : true
	});
});

chrome.storage.local.get(function (object) {
	enabled = object[enabled];
});*/