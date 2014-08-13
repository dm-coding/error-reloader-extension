Error Reloader
==============

# Overview
On slow and unreliable connections it's common for page loads to fail after low-level transport errors, socket errors and general timeouts. Even reliable connections can fail if the host is overloaded. Since there is no way for the browser to tell that the resource is actually available, common browser functionality is to stop after presenting an error to the user. On slow and unreliable networks such as the internet this behaviour is a mistake - the correct behaviour should be to minimise user intervention by continuously retrying the resource until the transient error goes away. This browser extension will automaticly reload the page if a transient error occurs.

# Browser Support
The extension was designed in Opera and works in both Chrome and Opera desktop editions.

# Installation
Go to the extensions area of either chrome or opera, then drag-and-drop the error-reloader extension from the extensions directory into the browser window.

# Privacy Information
As any page on the internet could in principal experience a transient error, this extension needs permission to operate on all URLs. However, users should rest assured that at no point will the extension ever communicate in any way with any process outside of the requested page's host.

# Mechanism of Operation
Currently, the extension sends a tab reload event after three seconds to the browser in the following instances: If the page's HTTP status code is any of 324, 408, 502, 503, 504, 522, 524, 598, or 599; or if the "net::ERR_ABORTED" socket error has occurred. However, this will not happen if the following resource types are interupted: "stylesheet", "script", "image", or "xmlhttprequest". Having sent a reload instruction to the tab, the extension increments a badge counter so that the user can keep track of how many times the tab has been reloaded so far. Thanks to improvements from Muhammad Ubaid Raza, it is also capable of reloading failed page resources by changing their final URL strings.

# Documentation and Further Information
Support pages are located at https://github.com/stormsaber/error-reloader-extension/issues. Do you know of any other socket errors or general transport problems which this extension fails to operate on? Users should submit all bug reports in a timely manner so that this extension can be improved.

Some simple test utilities, along with guidance on their useage, can be found in the ./tests directory.

# Licence
All code and icons are licenced under the GPLv2.