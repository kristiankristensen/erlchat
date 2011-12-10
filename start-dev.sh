#!/bin/sh
cd `dirname $0`
exec erl -pa $PWD/ebin \
     -pa ../ChicagoBoss/ebin \
     -pa ../ChicagoBoss/deps/*/ebin \
     -boss developing_app erlchat \
     -boot start_sasl -config boss -s reloader -s boss \
     -sname wildbill
