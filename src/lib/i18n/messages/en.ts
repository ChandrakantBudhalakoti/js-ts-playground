/**
 * The interface text in English: the source every translation follows.
 * `{name}` marks a value filled in at run time; keep it in translations.
 * Keys ending in `.one` / `.other` are a count's singular and plural.
 */
export const en = {
  // Toolbar
  "toolbar.run": "Run",
  "toolbar.runTooltip": "Run",
  "toolbar.stop": "Stop",
  "toolbar.format": "Format",
  "toolbar.formatJsOnly": "Format (JavaScript and TypeScript only)",
  "toolbar.reset": "Reset",
  "toolbar.share": "Share",
  "toolbar.moreActions": "More actions",
  "toolbar.source": "Source code on GitHub",
  "toolbar.offline": "Offline",
  "toolbar.offlineTitle":
    "You're offline. Languages you have used before still work.",
  "toolbar.loading": "Loading {name}…",
  "toolbar.downloading": "Downloading {name}",
  "toolbar.notDownloaded": "Not downloaded",
  "toolbar.notDownloadedTitle": "{name} is not downloaded yet",
  "toolbar.switchToHindi": "Switch to Hindi",
  "toolbar.switchToEnglish": "Switch to English",

  // Run status
  "status.idle": "Idle",
  "status.running": "Running",
  "status.completed": "Completed",
  "status.failed": "Failed",
  "status.timedOut": "Timed out",
  "status.stopped": "Stopped",

  // Language picker and Examples menu
  "language.label": "Language: {name}",
  "examples.button": "Examples",
  "examples.otherLanguages": "Other languages",
  "examples.allLanguages": "All languages",
  "examples.ofLanguage": "{name} examples",
  "examples.beginnerPrograms": "Beginner programs ({count})",
  "examples.programsFor": "{name} programs for beginners",

  // Panels
  "panel.code": "Code",
  "panel.console": "Console",
  "panel.problems": "Problems",
  "panel.input": "Input",
  "panel.copyOutput": "Copy output",
  "panel.copied": "Copied",
  "panel.clearConsole": "Clear console",
  "panel.resize": "Resize output panel",
  "panel.editor": "Editor",

  // Console
  "console.output": "Console output",
  "console.empty": "Press {run} to see your code's output here.",
  "console.shortcut": "Or press {keys} in the editor.",
  "console.downloadingHint":
    "{name} is downloading (about {size}, only the first time). Then it runs right in your browser.",
  "console.stackTrace": "Stack trace",
  "console.goTo": "Go to {file} line {line}, column {column}",
  "console.elapsed": "Time since the run started",

  // Friendly error explanations
  "friendly.title": "What this means",
  "friendly.goToLine": "Go to line {line}",

  // First download of a language
  "download.oneTime": "a one-time {size} download",
  "download.oneTimeUnknown": "a one-time download",
  "download.needs": "{subject} needs {size}.",
  "download.saved":
    "It is saved in your browser, so after that it works without internet.",
  "download.dataSaver": "Data Saver is on.",
  "download.cellular": "You seem to be on mobile data.",
  "download.slow": "Your connection looks slow, so it may take a while.",
  "download.download": "Download",
  "download.cancel": "Cancel",
  "download.offlineTitle": "You're offline. {subject} needs internet once.",
  "download.offlineBody":
    "It is {size}. Connect once to get it, and after that it works without internet. Languages you have already used still run.",
  "download.compiler": "The C and C++ compiler",

  // Problems panel
  "problems.unchecked":
    "{name} code is checked when it runs: errors appear in the Console, with a link to the line.",
  "problems.loading": "Loading the {name} checker…",
  "problems.download":
    "{name} is checked once it is downloaded (see the Console).",
  "problems.unavailable": "Checking is unavailable.",
  "problems.none": "No problems detected.",
  "problems.goTo": "Go to line {line}, column {column}",

  // Input panel
  "input.label": "Standard input",
  "input.placeholder": "Text the program reads, for example\nAda\n3 4 5",
  "input.help":
    "{name} reads this as standard input (stdin), from the start on every run. After the last line it sees the end of input.",

  // Settings
  "settings.title": "Settings",
  "settings.editor": "Editor",
  "settings.theme": "Theme",
  "settings.dark": "Dark",
  "settings.light": "Light",
  "settings.system": "System",
  "settings.fontSize": "Font size",
  "settings.tabSize": "Tab size",
  "settings.minimap": "Minimap",
  "settings.wordWrap": "Word wrap",
  "settings.execution": "Execution",
  "settings.timeLimit": "Time limit",
  "settings.blockTypeErrors": "Block Run on type errors",
  "settings.clearConsole": "Clear console on Run",
  "settings.interfaceLanguage": "Interface language",
  "settings.downloads": "Downloaded languages",
  "settings.askBeforeDownload": "Ask before downloading",
  "settings.downloadsNone":
    "None yet. Each language is saved the first time you run it, and then works offline.",
  "settings.remove": "Remove",
  "settings.removeName": "Remove {name}",
  "settings.shortcuts": "Shortcuts",
  "settings.shortcutRun": "Run",
  "settings.shortcutFormat": "Format",
  "settings.shortcutPalette": "Command palette",
  "settings.shortcutTabFocus": "Toggle Tab moves focus",

  // Touch selection menu
  "selection.toolbar": "Selection",
  "selection.cut": "Cut",
  "selection.copy": "Copy",
  "selection.copied": "Copied",
  "selection.paste": "Paste",
  "selection.selectAll": "Select all",
  "selection.copyFailed": "Could not copy to the clipboard.",
  "selection.pasteFailed": "Could not read the clipboard.",
  "selection.pasteHint": "Use the paste key on your keyboard instead.",

  // Code keys
  "keys.toolbar": "Code keys",
  "keys.tab": "Tab",
  "keys.left": "Left",
  "keys.right": "Right",
  "keys.up": "Up",
  "keys.down": "Down",
  "keys.undo": "Undo",

  // Running code
  "run.empty": "Nothing to run: the editor is empty.",
  "run.compiling": "Compiling {file}…",
  "run.compilingFirst":
    "Compiling {file} (the compiler downloads once, about {size})…",
  "run.cannotCompile": "Cannot compile {name}: {message}",
  "run.compileFailed":
    "Compilation failed with {errors}. See the Problems panel.",
  "run.compiled": "Compiled {file} in {seconds} s.",
  "run.compiledWarnings":
    "Compiled {file} in {seconds} s with {warnings} (see the Problems panel).",
  "run.checkerUnavailable":
    "The syntax checker is unavailable; running the code unchecked.",
  "run.fixSyntax": "Fix {errors} before running. See the Problems panel.",
  "run.blocked":
    'Run blocked by {errors}. Turn off "Block Run on type errors" in Settings to run anyway.',
  "run.withTypeErrors": "Running with {errors}. See the Problems panel.",
  "run.cancelled": "Run cancelled.",
  "run.started": "Run started",
  "run.starting": "Starting {name}…",
  "run.inputEmpty":
    "The program read standard input, but the Input panel is empty.",
  "run.finishedWithErrors": "Finished with errors in {duration}",
  "run.exited": "Exited with code {code} after {duration}",
  "run.completed": "Completed in {duration}",
  "run.timedOut":
    "Execution timed out after {duration}. The sandbox was terminated. Check for infinite loops, or raise the time limit in Settings.",
  "run.stopped": "Execution stopped.",
  "count.error.one": "{count} error",
  "count.error.other": "{count} errors",
  "count.warning.one": "{count} warning",
  "count.warning.other": "{count} warnings",
  "count.syntaxError.one": "{count} syntax error",
  "count.syntaxError.other": "{count} syntax errors",
  "count.typeError.one": "{count} type error",
  "count.typeError.other": "{count} type errors",

  // Notifications and dialogs
  "toast.shareOpenFailed": "The share link could not be opened.",
  "toast.lastDraft": "Your last draft was opened instead.",
  "toast.loadedShared": "Loaded shared code",
  "toast.openedExample": "Opened “{title}”",
  "toast.noExample": "That example does not exist.",
  "toast.previousDraft": "Your previous draft is still available.",
  "toast.restoreDraft": "Restore draft",
  "toast.formatFailed": "Could not format the code",
  "toast.formatPosition": "{message} (line {line}, column {column})",
  "toast.undo": "Undo",
  "toast.editorReset": "Editor reset",
  "toast.shareFailed": "Could not create a share link.",
  "toast.shareCopied": "Share link copied to clipboard",
  "toast.shareReady": "Share link ready",
  "toast.copyFromAddressBar": "Copy it from the address bar.",
  "toast.saved": "Saved in this browser",
  "toast.copyFailed": "Could not copy to the clipboard.",
  "dialog.openShared": "Open the shared code?",
  "dialog.reset": "Reset the editor?",
  "dialog.openExample": "Open “{title}”?",
  "dialog.replaceBody":
    "Your current code will be replaced. You can bring it back with the Undo button in the notification that follows, or with Undo (Ctrl/⌘ + Z) in the editor.",
  "dialog.cancel": "Cancel",
  "dialog.replace": "Replace",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
