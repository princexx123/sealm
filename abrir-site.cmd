@echo off
title SealM ON ONE
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:4173"
npm.cmd run preview -- --host 127.0.0.1
