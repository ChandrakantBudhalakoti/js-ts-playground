import type { Messages } from "./en";

/** The interface in Hinglish (Hindi in Latin script). See en.ts for the source text. */
export const hinglish: Messages = {
  // Toolbar
  "toolbar.run": "Run",
  "toolbar.runTooltip": "Code chalao",
  "toolbar.stop": "Stop",
  "toolbar.format": "Format",
  "toolbar.formatJsOnly": "Format (sirf JavaScript aur TypeScript ke liye)",
  "toolbar.reset": "Reset",
  "toolbar.share": "Share",
  "toolbar.moreActions": "Aur options",
  "toolbar.source": "GitHub par source code",
  "toolbar.offline": "Offline",
  "toolbar.offlineTitle":
    "Tum offline ho. Jo languages pehle use ki hain, woh ab bhi chalengi.",
  "toolbar.loading": "{name} load ho raha hai…",
  "toolbar.downloading": "{name} download ho raha hai",
  "toolbar.notDownloaded": "Download nahi hua",
  "toolbar.notDownloadedTitle": "{name} abhi download nahi hua hai",
  "toolbar.interfaceLanguage": "App ki bhasha",

  // Run status
  "status.idle": "Ready",
  "status.running": "Chal raha hai",
  "status.completed": "Ho gaya",
  "status.failed": "Fail ho gaya",
  "status.timedOut": "Time khatam",
  "status.stopped": "Rok diya",

  // Language picker and Examples menu
  "language.label": "Language: {name}",
  "examples.button": "Examples",
  "examples.otherLanguages": "Doosri languages",
  "examples.allLanguages": "Saari languages",
  "examples.ofLanguage": "{name} examples",
  "examples.beginnerPrograms": "Beginners ke programs ({count})",
  "examples.programsFor": "Beginners ke liye {name} programs",

  // Panels
  "panel.code": "Code",
  "panel.console": "Console",
  "panel.problems": "Problems",
  "panel.input": "Input",
  "panel.copyOutput": "Output copy karo",
  "panel.copied": "Copy ho gaya",
  "panel.clearConsole": "Console clear karo",
  "panel.resize": "Output panel ka size badlo",
  "panel.editor": "Editor",

  // Console
  "console.output": "Console output",
  "console.empty": "Apne code ka output yahan dekhne ke liye {run} dabao.",
  "console.shortcut": "Ya editor mein {keys} dabao.",
  "console.downloadingHint":
    "{name} download ho raha hai (lagbhag {size}, sirf pehli baar). Phir yeh seedha tumhare browser mein chalega.",
  "console.stackTrace": "Stack trace",
  "console.goTo": "{file} ki line {line}, column {column} par jao",
  "console.elapsed": "Run start hone ke baad ka time",

  // Friendly error explanations
  "friendly.title": "Iska matlab kya hai",
  "friendly.goToLine": "Line {line} par jao",

  // First download of a language
  "download.oneTime": "ek baar ka {size} download",
  "download.oneTimeUnknown": "ek baar ka download",
  "download.needs": "{subject} ke liye {size} chahiye.",
  "download.saved":
    "Yeh tumhare browser mein save ho jaata hai, toh uske baad bina internet ke chalta hai.",
  "download.dataSaver": "Data Saver on hai.",
  "download.cellular": "Lagta hai tum mobile data par ho.",
  "download.slow":
    "Tumhara internet slow lag raha hai, toh thoda time lag sakta hai.",
  "download.download": "Download",
  "download.cancel": "Cancel",
  "download.offlineTitle":
    "Tum offline ho. {subject} ke liye ek baar internet chahiye.",
  "download.offlineBody":
    "Yeh {size} hai. Ise lene ke liye ek baar internet on karo, uske baad yeh bina internet ke chalega. Jo languages pehle use kar chuke ho, woh ab bhi chalengi.",
  "download.compiler": "C aur C++ compiler",

  // Problems panel
  "problems.unchecked":
    "{name} code run hone par check hota hai: errors Console mein dikhte hain, line ke link ke saath.",
  "problems.loading": "{name} checker load ho raha hai…",
  "problems.download":
    "{name} download hone ke baad check hoga (Console dekho).",
  "problems.unavailable": "Abhi check nahi ho sakta.",
  "problems.none": "Koi problem nahi mili.",
  "problems.goTo": "Line {line}, column {column} par jao",

  // Input panel
  "input.label": "Standard input",
  "input.placeholder": "Woh text jo program padhega, jaise\nRiya\n3 4 5",
  "input.help":
    "{name} ise standard input (stdin) ki tarah padhta hai, har run mein shuru se. Last line ke baad input khatam ho jaata hai.",

  // Settings
  "settings.title": "Settings",
  "settings.editor": "Editor",
  "settings.theme": "Theme",
  "settings.dark": "Dark",
  "settings.light": "Light",
  "settings.system": "Device jaisa",
  "settings.fontSize": "Font size",
  "settings.tabSize": "Tab size",
  "settings.minimap": "Minimap",
  "settings.wordWrap": "Word wrap",
  "settings.execution": "Code chalana",
  "settings.timeLimit": "Time limit",
  "settings.blockTypeErrors": "Type error ho to Run roko",
  "settings.clearConsole": "Run par Console clear karo",
  "settings.interfaceLanguage": "App ki bhasha",
  "settings.downloads": "Downloaded languages",
  "settings.askBeforeDownload": "Download se pehle poocho",
  "settings.downloadsNone":
    "Abhi koi nahi. Har language pehli baar run karne par save ho jaati hai, phir offline bhi chalti hai.",
  "settings.remove": "Hatao",
  "settings.removeName": "{name} hatao",
  "settings.shortcuts": "Shortcuts",
  "settings.shortcutRun": "Run",
  "settings.shortcutFormat": "Format",
  "settings.shortcutPalette": "Command palette",
  "settings.shortcutTabFocus": "Tab key se focus badalna on/off karo",

  // Touch selection menu
  "selection.toolbar": "Selection",
  "selection.cut": "Cut",
  "selection.copy": "Copy",
  "selection.copied": "Copy ho gaya",
  "selection.paste": "Paste",
  "selection.selectAll": "Sab select karo",
  "selection.copyFailed": "Clipboard mein copy nahi ho paaya.",
  "selection.pasteFailed": "Clipboard read nahi ho paaya.",
  "selection.pasteHint": "Iski jagah apne keyboard ki paste key use karo.",

  // Code keys
  "keys.toolbar": "Code keys",
  "keys.tab": "Tab",
  "keys.left": "Left",
  "keys.right": "Right",
  "keys.up": "Up",
  "keys.down": "Down",
  "keys.undo": "Undo",

  // Running code
  "run.empty": "Run karne ko kuch nahi hai: editor khaali hai.",
  "run.compiling": "{file} compile ho rahi hai…",
  "run.compilingFirst":
    "{file} compile ho rahi hai (compiler ek baar download hota hai, lagbhag {size})…",
  "run.cannotCompile": "{name} compile nahi ho sakta: {message}",
  "run.compileFailed": "Compile nahi hua: {errors}. Problems tab dekho.",
  "run.compiled": "{file} {seconds} s mein compile ho gayi.",
  "run.compiledWarnings":
    "{file} {seconds} s mein compile ho gayi, {warnings} ke saath (Problems tab dekho).",
  "run.checkerUnavailable":
    "Syntax checker available nahi hai; code bina check kiye chal raha hai.",
  "run.fixSyntax":
    "Run karne se pehle {errors} theek karo. Problems tab dekho.",
  "run.blocked":
    '{errors} ki wajah se Run ruk gaya. Phir bhi chalana hai toh Settings mein "Type error ho to Run roko" off karo.',
  "run.withTypeErrors": "{errors} ke saath chal raha hai. Problems tab dekho.",
  "run.cancelled": "Run cancel ho gaya.",
  "run.started": "Run start hua",
  "run.starting": "{name} start ho raha hai…",
  "run.inputEmpty":
    "Program ne standard input padha, lekin Input tab khaali hai.",
  "run.finishedWithErrors": "{duration} mein errors ke saath khatam hua",
  "run.exited": "{duration} baad exit code {code} ke saath band hua",
  "run.completed": "{duration} mein poora hua",
  "run.timedOut":
    "{duration} baad time khatam ho gaya, toh program band kar diya gaya. Check karo koi loop hamesha toh nahi chal raha (infinite loop), ya Settings mein time limit badhao.",
  "run.stopped": "Program rok diya gaya.",
  "count.error.one": "{count} error",
  "count.error.other": "{count} errors",
  "count.warning.one": "{count} warning",
  "count.warning.other": "{count} warnings",
  "count.syntaxError.one": "{count} syntax error",
  "count.syntaxError.other": "{count} syntax errors",
  "count.typeError.one": "{count} type error",
  "count.typeError.other": "{count} type errors",

  // Notifications and dialogs
  "toast.shareOpenFailed": "Share link nahi khul paaya.",
  "toast.lastDraft": "Iski jagah tumhara pichhla draft khola gaya.",
  "toast.loadedShared": "Share kiya hua code khul gaya",
  "toast.openedExample": "“{title}” khul gaya",
  "toast.noExample": "Aisa koi example nahi hai.",
  "toast.previousDraft": "Tumhara pichhla draft abhi bhi hai.",
  "toast.restoreDraft": "Draft wapas lao",
  "toast.formatFailed": "Code format nahi ho paaya",
  "toast.formatPosition": "{message} (line {line}, column {column})",
  "toast.undo": "Undo",
  "toast.editorReset": "Editor reset ho gaya",
  "toast.shareFailed": "Share link nahi ban paaya.",
  "toast.shareCopied": "Share link clipboard mein copy ho gaya",
  "toast.shareReady": "Share link ready hai",
  "toast.copyFromAddressBar": "Address bar se copy kar lo.",
  "toast.saved": "Is browser mein save ho gaya",
  "toast.copyFailed": "Clipboard mein copy nahi ho paaya.",
  "dialog.openShared": "Share kiya hua code kholna hai?",
  "dialog.reset": "Editor reset karna hai?",
  "dialog.openExample": "“{title}” kholna hai?",
  "dialog.replaceBody":
    "Tumhara abhi ka code replace ho jaayega. Ise wapas laane ke liye baad mein aane wali notification mein Undo button dabao, ya editor mein Undo (Ctrl/⌘ + Z) karo.",
  "dialog.cancel": "Cancel",
  "dialog.replace": "Replace",
};
