import socket, sys, time, argparse

parser = argparse.ArgumentParser(description="This bad server accepts an HTTP connection but makes no reply in order to simulate net::ERR_EMPTY_RESPONSE. It replies after every 5 connections.")
parser.add_argument("-p", "--port", type=int, help="The port to listen for new connections on.", default=8080)
parser.add_argument("-t", "--tries", type=int, help="The number of attempts before a successful connection", default=5)
args = parser.parse_args()

serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
serversocket.bind(('localhost', args.port))
serversocket.listen(5)
print "Bad server is listening on port %s. Will reply after %s unsuccesful attempts.\n" % (args.port, args.tries)

#simulate successful transport after the 5th attempt
counter = 0

while True:
	#accept connections from outside
	(clientsocket, address) = serversocket.accept()

	#strictly speaking, none of the next stanza is actually nessesary.
	chunks = []
	bytes_recd = 0
	chunk = ""
	while "\r\n\r\n" not in chunk:
		chunk = clientsocket.recv(min(2048 - bytes_recd, 2048))
		if chunk == '':
			raise RuntimeError("socket connection broken (but not by me)")
		chunks.append(chunk)
		bytes_recd = bytes_recd + len(chunk)
	print  "Received: ".join(chunks)

	time.sleep(1);

	if counter > args.tries:
		clientsocket.send('Hello from bad server. Successful connection after %s attempts.' % args.tries);
		clientsocket.shutdown(0)

	clientsocket.close()

	counter += 1