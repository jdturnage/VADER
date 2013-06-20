temp1 	 := 0
temp2 	 := 0
URL 	 := "127.0.0.1:8000/counter"
XBMC_EXE     = C:\\Program Files (x86)\\XBMC\\XBMC.exe
XBMC_EXE2	 = C:\\Program Files\\XBMC\\XBMC.exe

;XBMC_Path    = C:\\Program Files (x86)\\XBMC
;XBMC_Path2    = C:\\Program Files\\XBMC

XBMC_imgName = XBMC.exe

Sleep 30000

Loop
{
	data      := ""
	request   := httpRequest(URL,data)
		
	StringTrimLeft, temp2, data, 12
	StringTrimRight, temp2, temp2, 15			

	; MsgBox First %temp1%
	; MsgBox Second %temp2%
	
	If (temp2 > temp1)
	{
		temp1 := temp2
	}
	Else 
	{
		;MsgBox "Restarting Service"
		temp1 :=0
		IfWinExist, XBMC
		{
			WinKill, XBMC
			Sleep 5000
			IfExist,%XBMC_EXE%
				Run %XBMC_EXE% -p
			IfNotExist,%XBMC_EXE%
				Run %XBMC_EXE2% -p
			;Run %XBMC_EXE%
		}
		Else
		{
			IfExist,%XBMC_EXE%
				Run %XBMC_EXE% -p
			IfNotExist,%XBMC_EXE%
				Run %XBMC_EXE2% -p
			;Run %XBMC_EXE%
		}
	}
	
	Sleep 45000
}
 

#include httprequest.ahk
