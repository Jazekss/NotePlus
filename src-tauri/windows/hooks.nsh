; Note+ instalētāja papildinājumi:
; noklusētā mape  C:\Program Files\JKapps\Note+  (kā pārējām JKapps programmām)

!define MUI_CUSTOMFUNCTION_GUIINIT JKapps_GuiInit

Function JKapps_GuiInit
  StrCmp $INSTDIR "$PROGRAMFILES64\Note+" 0 +2
    StrCpy $INSTDIR "$PROGRAMFILES64\JKapps\Note+"
FunctionEnd

; Klusajai instalācijai (/S), kur GUI netiek rādīts
!macro NSIS_HOOK_PREINSTALL
  StrCmp $INSTDIR "$PROGRAMFILES64\Note+" 0 +3
    StrCpy $INSTDIR "$PROGRAMFILES64\JKapps\Note+"
    SetOutPath $INSTDIR
!macroend
