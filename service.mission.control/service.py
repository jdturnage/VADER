import re
import os
import sys
import time
import SocketServer
import SimpleHTTPServer
from threading import Thread
import xbmc
import xbmcaddon
import xbmcgui
import binascii

if sys.version_info < (2, 7):
    import simplejson
else:
    import json as simplejson

__addon__        = xbmcaddon.Addon(id='service.mission.control')
__addonid__      = __addon__.getAddonInfo('id')
__addonversion__ = __addon__.getAddonInfo('version')
__addonname__    = __addon__.getAddonInfo('name')
__author__       = __addon__.getAddonInfo('author')
__icon__         = __addon__.getAddonInfo('icon')
__cwd__          = __addon__.getAddonInfo('path').decode("utf-8")
__resource__   = xbmc.translatePath( os.path.join( __cwd__, 'resources', 'lib' ).encode("utf-8") ).decode("utf-8")

sys.path.append(__resource__)

import serial

PORT = 8000

class SwitchStatus(SimpleHTTPServer.SimpleHTTPRequestHandler):
    
    def do_GET(self):
        if self.path == '/':
            print >>self.wfile, "<html><body>" + str(theCounter) + "<a href='/run'>Patient Test</a>" + str(theStatus) + "</body></html>"
        if self.path == '/run':
            print 'Patience is a virtue...'
            print >>self.wfile, "<html><body>" + str(theCounter) + "<a href='/'>Impatient Test</a>" + str(theStatus) + "</body></html>"

def startServing(server):
    print "begin serving requests"
    server.serve_forever()

if (__name__ == "__main__"):
    xbmc.log('Version %s started' % __addonversion__)
    theCounter = 0
    theStatus = {'left': 1, 'center1': 1, 'center2': 2, 'right1': 1, 'right2':2, 'actionCenter': 3}
    httpd = SocketServer.TCPServer(('', PORT), SwitchStatus)
    print "serving at port", PORT
    Thread(target=startServing, args=(httpd,)).start()
    print "starting the counter"
    while (not xbmc.abortRequested):
        time.sleep(2.5)
        theCounter += 1
        
        # This is where the serial stuff begins
        ser = serial.Serial(2, 9600, timeout=1)
        ser.flushInput()
        ser.write('\x05\x80\x81\x81')
        ser.read(2)
        out = ser.read()
        ser.close()
        foo = binascii.b2a_qp(out)
        source = foo[2]
        theStatus['left'] = source
        
        ser = serial.Serial(2, 9600, timeout=1)
        ser.flushInput()
        ser.write('\x05\x80\x82\x81')
        ser.read(2)
        out = ser.read()
        ser.close()
        foo = binascii.b2a_qp(out)
        source = foo[2]
        theStatus['center1'] = source
        
        ser = serial.Serial(2, 9600, timeout=1)
        ser.flushInput()
        ser.write('\x05\x80\x83\x81')
        ser.read(2)
        out = ser.read()
        ser.close()
        foo = binascii.b2a_qp(out)
        source = foo[2]
        theStatus['center2'] = source
        
        ser = serial.Serial(2, 9600, timeout=1)
        ser.flushInput()
        ser.write('\x05\x80\x84\x81')
        ser.read(2)
        out = ser.read()
        ser.close()
        foo = binascii.b2a_qp(out)
        source = foo[2]
        theStatus['right1'] = source
        
        ser = serial.Serial(2, 9600, timeout=1)
        ser.flushInput()
        ser.write('\x05\x80\x85\x81')
        ser.read(2)
        out = ser.read()
        ser.close()
        foo = binascii.b2a_qp(out)
        source = foo[2]
        theStatus['right2'] = source
        
        ser = serial.Serial(2, 9600, timeout=1)
        ser.flushInput()
        ser.write('\x05\x80\x86\x81')
        ser.read(2)
        out = ser.read()
        ser.close()
        foo = binascii.b2a_qp(out)
        source = foo[2]
        theStatus['actionCenter'] = source
    print "starting server shutdown"
    httpd.shutdown()
    print "finished server shutdown"