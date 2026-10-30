import type { Messages } from "./en";

/** The interface in Hindi (Devanagari). See en.ts for the source text. */
export const hi: Messages = {
  // Toolbar
  "toolbar.run": "Run",
  "toolbar.runTooltip": "Code चलाएँ",
  "toolbar.stop": "Stop",
  "toolbar.format": "Format",
  "toolbar.formatJsOnly": "Format (सिर्फ़ JavaScript और TypeScript के लिए)",
  "toolbar.reset": "Reset",
  "toolbar.share": "Share",
  "toolbar.moreActions": "और विकल्प",
  "toolbar.source": "GitHub पर source code",
  "toolbar.offline": "Offline",
  "toolbar.offlineTitle":
    "आप offline हैं। जो languages आप पहले इस्तेमाल कर चुके हैं, वे अब भी चलेंगी।",
  "toolbar.loading": "{name} load हो रहा है…",
  "toolbar.downloading": "{name} download हो रहा है",
  "toolbar.notDownloaded": "Download नहीं हुआ",
  "toolbar.notDownloadedTitle": "{name} अभी download नहीं हुआ है",
  "toolbar.interfaceLanguage": "App की भाषा",

  // Run status
  "status.idle": "तैयार",
  "status.running": "चल रहा है",
  "status.completed": "पूरा हुआ",
  "status.failed": "Fail हुआ",
  "status.timedOut": "समय खत्म",
  "status.stopped": "रोका गया",

  // Language picker and Examples menu
  "language.label": "Language: {name}",
  "examples.button": "उदाहरण",
  "examples.otherLanguages": "दूसरी languages",
  "examples.allLanguages": "सभी languages",
  "examples.ofLanguage": "{name} के उदाहरण",
  "examples.beginnerPrograms": "शुरुआती programs ({count})",
  "examples.programsFor": "शुरुआत करने वालों के लिए {name} programs",

  // Panels
  "panel.code": "Code",
  "panel.console": "Console",
  "panel.problems": "Problems",
  "panel.input": "Input",
  "panel.copyOutput": "Output copy करें",
  "panel.copied": "Copy हो गया",
  "panel.clearConsole": "Console साफ़ करें",
  "panel.resize": "Output panel का size बदलें",
  "panel.editor": "Editor",

  // Console
  "console.output": "Console output",
  "console.empty": "अपने code का output यहाँ देखने के लिए {run} दबाएँ।",
  "console.shortcut": "या editor में {keys} दबाएँ।",
  "console.downloadingHint":
    "{name} download हो रहा है (करीब {size}, सिर्फ़ पहली बार)। फिर यह सीधे आपके browser में चलेगा।",
  "console.stackTrace": "Stack trace",
  "console.goTo": "{file} की line {line}, column {column} पर जाएँ",
  "console.elapsed": "Run शुरू होने के बाद का समय",

  // Friendly error explanations
  "friendly.title": "इसका मतलब क्या है",
  "friendly.goToLine": "Line {line} पर जाएँ",

  // First download of a language
  "download.oneTime": "एक बार का {size} download",
  "download.oneTimeUnknown": "एक बार का download",
  "download.needs": "{subject} के लिए {size} चाहिए।",
  "download.saved":
    "यह आपके browser में save हो जाता है, इसलिए उसके बाद यह बिना internet के चलता है।",
  "download.dataSaver": "Data Saver चालू है।",
  "download.cellular": "लगता है आप mobile data पर हैं।",
  "download.slow": "आपका internet धीमा लग रहा है, इसलिए थोड़ा समय लग सकता है।",
  "download.download": "Download",
  "download.cancel": "रद्द करें",
  "download.offlineTitle":
    "आप offline हैं। {subject} के लिए एक बार internet चाहिए।",
  "download.offlineBody":
    "यह {size} है। इसे पाने के लिए एक बार internet से जुड़ें, उसके बाद यह बिना internet के चलेगा। जो languages आप पहले इस्तेमाल कर चुके हैं, वे अब भी चलेंगी।",
  "download.compiler": "C और C++ compiler",

  // Problems panel
  "problems.unchecked":
    "{name} code run होने पर check होता है: errors Console में दिखते हैं, line के link के साथ।",
  "problems.loading": "{name} checker load हो रहा है…",
  "problems.download":
    "{name} download होने के बाद check होगा (Console देखें)।",
  "problems.unavailable": "अभी check नहीं हो सकता।",
  "problems.none": "कोई problem नहीं मिली।",
  "problems.goTo": "Line {line}, column {column} पर जाएँ",

  // Input panel
  "input.label": "Standard input",
  "input.placeholder": "वह text जो program पढ़ेगा, जैसे\nRiya\n3 4 5",
  "input.help":
    "{name} इसे standard input (stdin) की तरह पढ़ता है, हर run में शुरू से। आख़िरी line के बाद input खत्म हो जाता है।",

  // Settings
  "settings.title": "Settings",
  "settings.editor": "Editor",
  "settings.theme": "Theme",
  "settings.dark": "Dark",
  "settings.light": "Light",
  "settings.system": "Device जैसा",
  "settings.fontSize": "Font size",
  "settings.tabSize": "Tab size",
  "settings.minimap": "Minimap",
  "settings.wordWrap": "Word wrap",
  "settings.execution": "Code चलाना",
  "settings.timeLimit": "समय सीमा",
  "settings.blockTypeErrors": "Type error होने पर Run रोकें",
  "settings.clearConsole": "Run पर Console साफ़ करें",
  "settings.interfaceLanguage": "App की भाषा",
  "settings.downloads": "Download की गई languages",
  "settings.askBeforeDownload": "Download से पहले पूछें",
  "settings.downloadsNone":
    "अभी कोई नहीं। हर language पहली बार run करने पर save हो जाती है, फिर offline भी चलती है।",
  "settings.remove": "हटाएँ",
  "settings.removeName": "{name} हटाएँ",
  "settings.shortcuts": "Shortcuts",
  "settings.shortcutRun": "Run",
  "settings.shortcutFormat": "Format",
  "settings.shortcutPalette": "Command palette",
  "settings.shortcutTabFocus": "Tab key से focus बदलना चालू/बंद करें",

  // Touch selection menu
  "selection.toolbar": "Selection",
  "selection.cut": "Cut",
  "selection.copy": "Copy",
  "selection.copied": "Copy हो गया",
  "selection.paste": "Paste",
  "selection.selectAll": "सब चुनें",
  "selection.copyFailed": "Clipboard में copy नहीं हो पाया।",
  "selection.pasteFailed": "Clipboard पढ़ा नहीं जा सका।",
  "selection.pasteHint": "इसकी जगह अपने keyboard की paste key इस्तेमाल करें।",

  // Code keys
  "keys.toolbar": "Code keys",
  "keys.tab": "Tab",
  "keys.left": "बाएँ",
  "keys.right": "दाएँ",
  "keys.up": "ऊपर",
  "keys.down": "नीचे",
  "keys.undo": "Undo",

  // Running code
  "run.empty": "चलाने के लिए कुछ नहीं है: editor खाली है।",
  "run.compiling": "{file} compile हो रही है…",
  "run.compilingFirst":
    "{file} compile हो रही है (compiler एक बार download होता है, करीब {size})…",
  "run.cannotCompile": "{name} compile नहीं हो सकता: {message}",
  "run.compileFailed": "Compile नहीं हो पाया: {errors}। Problems tab देखें।",
  "run.compiled": "{file} {seconds} s में compile हो गई।",
  "run.compiledWarnings":
    "{file} {seconds} s में compile हो गई, {warnings} के साथ (Problems tab देखें)।",
  "run.checkerUnavailable":
    "Syntax checker उपलब्ध नहीं है; code बिना check किए चल रहा है।",
  "run.fixSyntax": "Run करने से पहले {errors} ठीक करें। Problems tab देखें।",
  "run.blocked":
    '{errors} की वजह से Run रोका गया। फिर भी चलाना हो तो Settings में "Type error होने पर Run रोकें" बंद करें।',
  "run.withTypeErrors": "{errors} के साथ चल रहा है। Problems tab देखें।",
  "run.cancelled": "Run रद्द किया गया।",
  "run.started": "Run शुरू हुआ",
  "run.starting": "{name} शुरू हो रहा है…",
  "run.inputEmpty": "Program ने standard input पढ़ा, लेकिन Input tab खाली है।",
  "run.finishedWithErrors": "{duration} में errors के साथ खत्म हुआ",
  "run.exited": "{duration} बाद exit code {code} के साथ बंद हुआ",
  "run.completed": "{duration} में पूरा हुआ",
  "run.timedOut":
    "{duration} बाद समय खत्म हो गया, इसलिए program बंद कर दिया गया। देखें कि कोई loop हमेशा तो नहीं चल रहा (infinite loop), या Settings में समय सीमा बढ़ाएँ।",
  "run.stopped": "Program रोक दिया गया।",
  "count.error.one": "{count} error",
  "count.error.other": "{count} errors",
  "count.warning.one": "{count} warning",
  "count.warning.other": "{count} warnings",
  "count.syntaxError.one": "{count} syntax error",
  "count.syntaxError.other": "{count} syntax errors",
  "count.typeError.one": "{count} type error",
  "count.typeError.other": "{count} type errors",

  // Notifications and dialogs
  "toast.shareOpenFailed": "Share link नहीं खुल पाया।",
  "toast.lastDraft": "इसकी जगह आपका पिछला draft खोला गया।",
  "toast.loadedShared": "Share किया गया code खुल गया",
  "toast.openedExample": "“{title}” खुल गया",
  "toast.noExample": "यह उदाहरण मौजूद नहीं है।",
  "toast.previousDraft": "आपका पिछला draft अभी भी मौजूद है।",
  "toast.restoreDraft": "Draft वापस लाएँ",
  "toast.formatFailed": "Code format नहीं हो पाया",
  "toast.formatPosition": "{message} (line {line}, column {column})",
  "toast.undo": "Undo",
  "toast.editorReset": "Editor reset हो गया",
  "toast.shareFailed": "Share link नहीं बन पाया।",
  "toast.shareCopied": "Share link clipboard में copy हो गया",
  "toast.shareReady": "Share link तैयार है",
  "toast.copyFromAddressBar": "इसे address bar से copy करें।",
  "toast.saved": "इस browser में save हो गया",
  "toast.copyFailed": "Clipboard में copy नहीं हो पाया।",
  "dialog.openShared": "Share किया गया code खोलें?",
  "dialog.reset": "Editor reset करें?",
  "dialog.openExample": "“{title}” खोलें?",
  "dialog.replaceBody":
    "आपका अभी का code बदल जाएगा। आप इसे बाद में आने वाली notification के Undo button से, या editor में Undo (Ctrl/⌘ + Z) से वापस ला सकते हैं।",
  "dialog.cancel": "रद्द करें",
  "dialog.replace": "बदलें",
};
