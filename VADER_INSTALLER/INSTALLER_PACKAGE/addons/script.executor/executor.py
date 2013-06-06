import re
import os
import sys
import xbmc
import xbmcaddon
import xbmcgui
import time
import urlparse
import urllib

if sys.version_info < (2, 7):
    import simplejson
else:
    import json as simplejson

__addon__        = xbmcaddon.Addon(id='script.executor')
__addonid__      = __addon__.getAddonInfo('id')
__addonversion__ = __addon__.getAddonInfo('version')
__addonname__    = __addon__.getAddonInfo('name')
__author__       = __addon__.getAddonInfo('author')
__icon__         = __addon__.getAddonInfo('icon')

class Executor:
    def __init__(self):
        self.arg1 = ''
        self.arg2 = ''
        self.arg3 = ''
        self.arg4 = ''
        self.url = 'http://127.0.0.1:8000'
        try:
            xbmc.log('## arg 0: %s' % sys.argv[0])
            xbmc.log('## arg 1: %s' % sys.argv[1])
            self.arg1 = sys.argv[1]
            xbmc.log('## arg 2: %s' % sys.argv[2])
            self.arg2 = sys.argv[2]
            xbmc.log('## arg 3: %s' % sys.argv[3])
            self.arg3 = sys.argv[3]
            xbmc.log('## arg 4: %s' % sys.argv[4])
            self.arg4 = sys.argv[4]
        except:
            pass
        if self.arg1 == '':
            xbmc.executebuiltin('Notification(%s, %s, %d, %s)'%('Executor Error','No script specified for execution',5000, __icon__))
            #print self.url
            #urllib.urlopen(self.url)
        elif self.arg1 != '' and self.arg2 == '':
            mcURL = self.url + '/' + urllib.quote_plus(self.arg1)
            print mcURL
            urllib.urlopen(mcURL)
        elif self.arg1 != '' and self.arg2 != '' and self.arg3 == '':
            mcURL = self.url + '/' + urllib.quote_plus(self.arg1) + '/' + urllib.quote_plus(self.arg2)
            print mcURL
            urllib.urlopen(mcURL)
        elif self.arg1 != '' and self.arg2 != '' and self.arg3 != '' and self.arg4 == '':
            mcURL = self.url + '/' + urllib.quote_plus(self.arg1) + '/' + urllib.quote_plus(self.arg2) + '/' + urllib.quote_plus(self.arg3)
            print mcURL
            urllib.urlopen(mcURL)
        else:
            mcURL = self.url + '/' + urllib.quote_plus(self.arg1) + '/' + urllib.quote_plus(self.arg2) + '/' + urllib.quote_plus(self.arg3) + '/' + urllib.quote_plus(self.arg4)
            print mcURL
            urllib.urlopen(mcURL)

if __name__ == '__main__':
    xbmc.log('######## Script Executor: Testing...')
    xbmc.log('## Add-on ID   = %s' % str(__addonid__))
    xbmc.log('## Add-on Version = %s' % str(__addonversion__))
    Executor()