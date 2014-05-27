import socket, sys, time, argparse

parser = argparse.ArgumentParser(description="This bad server accepts an HTTP connection and replies with a valid HTML document which links to assets. However, attemps to load the assets should result in a net::ERR_EMPTY_RESPONSE.")
parser.add_argument("-p", "--port", type=int, help="The port to listen for new connections on.", default=8080)
parser.add_argument("-t", "--tries", type=int, help="The number of attempts before a successful connection", default=5)
parser.add_argument("-s", "--status", help="The HTTP status the server should reply with", default=504)
args = parser.parse_args()

print "Bad HTTP server is listening on port %s. Will reply after %s unsuccesful attempts.\n" % (args.port, args.tries)
serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

serversocket.bind(('localhost', args.port))

serversocket.listen(5)

response_text = """HTTP/1.0 %s OK
Server: BadHTTPServer v0.1
Content-Type: text/html

""" % args.status

counter = 0

while True:
    #accept connections from outside
    (clientsocket, address) = serversocket.accept()
    time.sleep(1);
    counter += 1

    if counter > args.tries:
    	response_text = """HTTP/1.0 200 OK
Server: BadHTTPServer v0.1
Content-Type: text/html

"""

    clientsocket.send(response_text);
    clientsocket.close()