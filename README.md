Erlchat
=======

Erlchat is a simple chat server built using the Chicago Boss web
framework (www.chicagoboss.org) for Erlang (www.erlang.org).

It borrows the UI from Chatify and basically switches out the backend.

Running it
------------
* Fork the repo
* Make
* Run ./start-dev.sh

Point your browser to http://localhost:8001 and chat away.

The above expects a copy of the Chicago Boss tree to be in an adjacent
directory, ie.

  ChicagoBoss
  ├── contrib
  ├── doc-src
  ├── ebin
  ├── include
  ├── skel
  └── src
  erlchat
  ├── ebin
  ├── include
  ├── log
  ├── priv
  └── src


Credits
----------
Jordan Orelli and Seth Murphy for Chatify
(github.com/jordanorelli/chatify).

License
-------
MIT
