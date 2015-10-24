# nrsc
simple nodejs tool to run redis scans and execute command on matches

USE WITH EXTREME CARE!

# usage

## default parameters

node nrsc -v false -silent false -h localhost -p 6379 -m "nrsc*" -c "get"

## example to delete all matching keys

node nrsc -m "session*" -c "del"

## available options

-m MATCH, defaults to "nothing". this is NOT OPTIONAL. Provides a redis pattern to run the scan with.

-c COMMAND, defaults to "get". this is usually a GET or a DEL. the command will ALWAYS be executed with only the KEY of each match as a parameter.

-v  VERBOSE, defaults to "false". if set to true, the fully info for each matched key will be displayed.

-s SILENT, defaults to "false". if set to true, the result of the executed command for each match will NOT be printed out anymore

-h HOST, defaults to "localhost". the redis host you wish to connect to.

-p PORT, defaults to "6379". the redis port you wish to connect to.


