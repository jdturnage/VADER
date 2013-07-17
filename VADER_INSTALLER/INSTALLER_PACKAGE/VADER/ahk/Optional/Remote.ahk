Volume_Up::
	URL 	 := "127.0.0.1:8000/display/1/volume/+"
	data      := ""
	request   := httpRequest(URL,data)
	Sleep 100
	return
Volume_Down::
	URL 	 := "127.0.0.1:8000/display/1/volume/-"
	data      := ""
	request   := httpRequest(URL,data)
	Sleep 100
	return
Volume_Mute::
	URL 	 := "127.0.0.1:8000/display/1/volume/mute"
	data      := ""
	request   := httpRequest(URL,data)
	return
+F3::
	URL 	 := "127.0.0.1:8000/display/1/power"
	data      := ""
	request   := httpRequest(URL,data)
	return
+F4::
	URL 	 := "127.0.0.1:8000/switch/2/1"
	data      := ""
	request   := httpRequest(URL,data)
	return
+F5::
	URL 	 := "127.0.0.1:8000/switch/3/1"
	data      := ""
	request   := httpRequest(URL,data)
	return
+F6::
	URL 	 := "127.0.0.1:8000/switch/4/1"
	data      := ""
	request   := httpRequest(URL,data)
	return
Home::
	IfWinNotExist, XBMC
	{
		Run "C:\\XBMC\\XBMC.exe" -p
		Sleep 5000
	}
	
	URL 	 := "127.0.0.1:8000/display/1/power/on"
	data      := ""
	request   := httpRequest(URL,data)
	
	SetTitleMatchMode, 2
	IfWinExist, MimioStudio Notebook
	{
		WinKill
		Send {Down}
		Send {Space}
	}

	SetTitleMatchMode, 3
	IfWinExist, XBMC
	{
		WinActivate
		Send {Home}
	}
	
	URL 	 := "127.0.0.1:8000/switch/2/1"
	data      := ""
	request   := httpRequest(URL,data)
	Sleep 100
	URL 	 := "127.0.0.1:8000/switch/1/1"
	data      := ""
	request   := httpRequest(URL,data)
	
	WinGet, Style, Style, ahk_class XBMC
	if (Style & 0xC00000)  ;Detects if XBMC has a title bar.
	{
		Send {VKDC}  ;Maximize XBMC to fullscreen mode if its in a window mode.
	}
	
	return

#include httprequest.ahk
