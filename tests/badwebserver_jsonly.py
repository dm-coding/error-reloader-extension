import socket, sys, time, argparse

parser = argparse.ArgumentParser(description="This bad server accepts an HTTP connection and replies with a valid HTML document which links to assets. However, attemps to load the assets should result in a net::ERR_EMPTY_RESPONSE.")
parser.add_argument("-p", "--port", type=int, help="The port to listen for new connections on.", default=8080)
parser.add_argument("-t", "--tries", type=int, help="The number of attempts before asset requests will be responded to successfully", default=5)
args = parser.parse_args()

serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
serversocket.bind(('localhost', args.port))
serversocket.listen(5)
print "The bad web server is listening on port %s. Requests for the HTML index will always be replied to. Assets requests will be responded to after %s unsuccessful attempts.\n" % (args.port, args.tries)

response_text = """HTTP/1.0 200 OK
Server: BadWebServer v0.1
Content-Type: text/html

<!DOCTYPE html>
	<head>
		<meta charset="utf-8">
		<title>Bad Web Server</title>
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js"></script>
		<script src="/script.js" id="script01"></script>
		<script type="text/javascript">
			function refresh_location_hints() {
				$('#for_script01').val($('#script01').attr('src'));
				$('#for_css01').val($('#css01').attr('href'));
				$('#for_img01').val($('#img01').attr('src'));
				$('#img01').attr('alt', $('#img01').attr('src'));
				setTimeout(function() { 
					refresh_location_hints(); 
				}, 1000);
			}
			$(document).ready(function() {
				setTimeout(function() { 
					refresh_location_hints(); 
				}, 1000);
			});
		</script>
		<style>
			input { width: 600px; }
		</style>
	</head>
	<body>
		<header>
			<h1>About Bad Web Server</h1>
			<p>The bad web server will correctly transfer a valid HTML5 document to the browser when the browser requests the resource identified as '/'. The page will also request images, stylesheets and javascript resources from the server - but these should all result in the browser encountering a socket error and triggering a net::ERR_EMPTY_RESPONSE. The javascript  will correctly load after the 5th attempt and display an alert to the user when it loads correctly, as will the CSS resource. We also import JQuery to dynamicly hint at the current location of each failed resource for testing.</p>
		</header>
		<article>
			<input type="text" id="for_script01"> External Script (#script01) URL<br>
		</article>
	</body>
</html>"""

js_response_text = """HTTP/1.0 200 OK
Server: BadWebServer v0.1
Content-Type: text/javascript

alert("Javascript resource ('#script_01') loaded successfully after %s attempts");""" % args.tries

css_response_text = """HTTP/1.0 200 OK
Server: BadWebServer v0.1
Content-Type: text/stylesheet

* { margin: 5px; padding: 5px; }
body { background-color: #00ff00; color: #555555; }"""

css_requests = js_requests = 0

while True:
	#accept connections from outside
	(clientsocket, address) = serversocket.accept()

	chunks = []
	bytes_recd = 0
	chunk = ""
	while "\r\n\r\n" not in chunk:
		chunk = clientsocket.recv(min(2048 - bytes_recd, 2048))
		if chunk == '':
			raise RuntimeError("socket connection broken (but not by me)")
		chunks.append(chunk)
		bytes_recd = bytes_recd + len(chunk)
	header = ''.join(chunks)
	print "Received: " + header
	request_line = header.split("\r\n")[0]
	resource_marker = request_line.split()[1]

	if resource_marker is "/" or resource_marker is "/index.html" or resource_marker is "/index.htm":
		print "^ INDEX - WILL REPLY ^"
		clientsocket.send(response_text);
		clientsocket.shutdown(0)
	elif ".css" in resource_marker:
		css_requests += 1
		if css_requests > args.tries:
			css_requests = 0
			print "^ FINAL CSS REQUEST - WILL REPLY ^"
			clientsocket.send(css_response_text)
			clientsocket.shutdown(0)
		else:
			print "^ CSS REQUEST #%s - WILL NOT REPLY ^" % css_requests
	elif ".js" in resource_marker:
		js_requests += 1
		if js_requests > args.tries:
			js_requests = 0
			print "^ FINAL JS REQUEST - WILL REPLY ^"
			clientsocket.send(js_response_text)
			clientsocket.shutdown(0)
		else:
			print "^ JS REQUEST #%s - WILL NOT REPLY ^" % js_requests
	else:
		print "^ WILL NOT REPLY ^"
	print "\n"
	clientsocket.close()