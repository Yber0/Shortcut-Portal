@echo off
:: File explorer
reg add "HKCR\fileexplorer" /ve /d "URL:File Explorer Protocol" /f
reg add "HKCR\fileexplorer" /v "URL Protocol" /d "" /f
reg add "HKCR\fileexplorer\shell\open\command" /ve /d "\"C:\Windows\explorer.exe"" /f