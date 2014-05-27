Simple Bad Servers
==================

The programs in this directory are designed to emulate simple socket, transport and HTTP errors of the kind commonly found on congested networks. All programs accept the -p (--port) and -t (--tries) parameters to modify port (default 8080) and the number of tries before the connection should proceed (default 5) respectively.

* net::ERR_EMPTY_RESPONSE
Run python badserver.py

* Inline assets with net::ERR_EMPTY_RESPONSE
Requests for the index HTML page are met with a fully-formed, valid HTML5 document including auxilliary resource. Secondary requests for stylesheets and script files succeed after x attempts. All other requests fail. Run python badwebserver.py

* HTTP Errors
Run python badhttperrors.py nnn where nnn is the status you wish the server to reply with.