import type { Locale } from "@/lib/i18n/locales";
import type { Language } from "@/types/playground";

/**
 * Plain-language explanations of the errors beginners meet most, shown
 * under the original error message (which always stays visible: learning to
 * read real errors is part of learning to program).
 *
 * To add one, see "Adding a friendly error explanation" in CONTRIBUTING.md.
 * Rules are tried in order and the first match wins, so put specific rules
 * before general ones.
 */
export interface FriendlyRule {
  /** Unique id (tests use it). */
  id: string;
  /** Languages whose errors it explains ("java" before Java runs is fine). */
  languages: readonly (Language | "java")[] | "any";
  /**
   * Tested against the error as "<Name>: <message>" (for example
   * "NameError: name 'x' is not defined"), or a compiler's message as is.
   */
  pattern: RegExp;
  /**
   * The explanation in each interface language. `{line}` becomes the
   * error's line number, `{1}`, `{2}`, … the pattern's groups.
   */
  text: Record<Locale, string>;
}

const C = ["c", "cpp"] as const;

export const RULES: readonly FriendlyRule[] = [
  // --- Python ---------------------------------------------------------------
  {
    id: "py-unexpected-indent",
    languages: ["python"],
    pattern: /^IndentationError: unexpected indent/,
    text: {
      en: "Line {line} has extra spaces at the start. In Python, lines inside the same block must line up exactly.",
      hi: "Line {line} की शुरुआत में ज़्यादा spaces हैं। Python में एक ही block की सभी lines बिल्कुल एक ही जगह से शुरू होनी चाहिए।",
      hinglish:
        "Line {line} ke shuru mein extra spaces hain. Python mein ek block ki saari lines bilkul ek hi jagah se shuru honi chahiye.",
    },
  },
  {
    id: "py-expected-indent",
    languages: ["python"],
    pattern: /^IndentationError: expected an indented block/,
    text: {
      en: "The line after a colon (:) must be indented: move it a few spaces to the right (4 is usual), like the other lines of that block.",
      hi: "Colon (:) के बाद वाली line को indent करना ज़रूरी है: उसे कुछ spaces दाईं ओर खिसकाएँ (आमतौर पर 4), उस block की बाकी lines की तरह।",
      hinglish:
        "Colon (:) ke baad wali line indent honi chahiye: use kuch spaces right mein khisakao (aam taur par 4), us block ki baaki lines ki tarah.",
    },
  },
  {
    id: "py-unindent",
    languages: ["python"],
    pattern: /^IndentationError: unindent does not match/,
    text: {
      en: "Line {line} starts with a different number of spaces than the lines around it. Make it line up with the block it belongs to.",
      hi: "Line {line} की शुरुआत में आसपास की lines से अलग गिनती के spaces हैं। इसे उसी block की lines की सीध में लाएँ जिसका यह हिस्सा है।",
      hinglish:
        "Line {line} ke shuru mein aas-paas ki lines se alag ginti ke spaces hain. Ise apne block ki baaki lines ki seedh mein lao.",
    },
  },
  {
    id: "py-missing-colon",
    languages: ["python"],
    pattern: /^SyntaxError: expected ':'/,
    text: {
      en: "A colon (:) is missing at the end of line {line}. Lines that start a block (if, elif, else, for, while, def) end with a colon.",
      hi: "Line {line} के आखिर में colon (:) नहीं है। जो lines कोई block शुरू करती हैं (if, elif, else, for, while, def), उनके आखिर में colon लगता है।",
      hinglish:
        "Line {line} ke end mein colon (:) missing hai. Jo lines block shuru karti hain (if, elif, else, for, while, def), unke end mein colon lagta hai.",
    },
  },
  {
    id: "py-unclosed-bracket",
    languages: ["python"],
    pattern: /^SyntaxError: '([([{])' was never closed/,
    text: {
      en: "A bracket {1} was opened but never closed. Count the opening and closing brackets on line {line}.",
      hi: "एक bracket {1} खोला गया, लेकिन बंद नहीं किया गया। Line {line} पर खुलने और बंद होने वाले brackets गिनें।",
      hinglish:
        "Ek bracket {1} khola gaya par band nahi kiya. Line {line} par khulne aur band hone wale brackets gino.",
    },
  },
  {
    id: "py-unterminated-string",
    languages: ["python"],
    pattern: /^SyntaxError: unterminated string literal/,
    text: {
      en: "Some text in quotes on line {line} has no closing quote. Every \" or ' needs a matching one at the end of the text.",
      hi: "Line {line} पर quotes में लिखे किसी text का closing quote नहीं है। हर \" या ' के लिए text के आखिर में वैसा ही एक और quote चाहिए।",
      hinglish:
        "Line {line} par quotes wale kisi text ka closing quote missing hai. Har \" ya ' ke liye text ke end mein waisa hi ek aur quote chahiye.",
    },
  },
  {
    id: "py-name-error",
    languages: ["python"],
    pattern: /^NameError: name '(\w+)' is not defined/,
    text: {
      en: "Python does not know the name {1}. Check its spelling (capital letters count) and that it gets a value before line {line}. If you meant text, put it in quotes.",
      hi: "Python {1} नाम को नहीं पहचानता। इसकी spelling जाँचें (capital और small letters में फ़र्क होता है) और देखें कि line {line} से पहले इसे कोई value मिली हो। अगर आप text लिखना चाहते थे, तो उसे quotes में रखें।",
      hinglish:
        "Python {1} naam ko nahi jaanta. Iski spelling check karo (capital letters ka farak padta hai) aur dekho ki line {line} se pehle isko koi value mili ho. Agar text likhna tha, toh use quotes mein daalo.",
    },
  },
  {
    id: "py-str-plus-number",
    languages: ["python"],
    pattern:
      /^TypeError: (?:can only concatenate str \(not "\w+"\) to str|unsupported operand type\(s\) for \+: '(?:int|float)' and 'str'|unsupported operand type\(s\) for \+: 'str' and '(?:int|float)')/,
    text: {
      en: "The program tried to add text and a number with +. Turn the number into text with str(...), or the text into a number with int(...), first. print() can also take both, separated by commas.",
      hi: "Program ने + से text और number को जोड़ने की कोशिश की। पहले number को str(...) से text में बदलें, या text को int(...) से number में। print() में दोनों को commas से अलग करके भी दे सकते हैं।",
      hinglish:
        "Program ne + se text aur number ko jodne ki koshish ki. Pehle number ko str(...) se text banao, ya text ko int(...) se number. print() mein dono ko commas se alag karke bhi de sakte ho.",
    },
  },
  {
    id: "py-int-from-text",
    languages: ["python"],
    pattern: /^ValueError: invalid literal for int\(\) with base 10: '(.*)'/,
    text: {
      en: "int() could not turn '{1}' into a whole number. If the value comes from input(), check the Input tab: the program expected a whole number there.",
      hi: "int() '{1}' को whole number (पूर्ण संख्या) में नहीं बदल पाया। अगर value input() से आ रही है, तो Input tab देखें: program को वहाँ whole number चाहिए था।",
      hinglish:
        "int() '{1}' ko whole number mein nahi badal paaya. Agar value input() se aa rahi hai, toh Input tab check karo: program ko wahan whole number chahiye tha.",
    },
  },
  {
    id: "py-index-error",
    languages: ["python"],
    pattern: /^IndexError: (list|string|tuple) index out of range/,
    text: {
      en: "Line {line} asks for a position the {1} does not have. Positions start at 0, so the last one is len(...) - 1.",
      hi: "Line {line} ऐसी position माँग रही है जो उस {1} में है ही नहीं। Positions 0 से शुरू होती हैं, इसलिए आखिरी position len(...) - 1 होती है।",
      hinglish:
        "Line {line} aisi position maang rahi hai jo is {1} mein hai hi nahi. Positions 0 se shuru hoti hain, isliye last wali len(...) - 1 hoti hai.",
    },
  },
  {
    id: "py-zero-division",
    languages: ["python"],
    pattern: /^ZeroDivisionError/,
    text: {
      en: "Line {line} divides by zero, which has no answer. Check the number before dividing, for example with if divisor != 0:.",
      hi: "Line {line} zero से भाग दे रही है, जिसका कोई जवाब नहीं होता। भाग देने से पहले number जाँचें, जैसे if divisor != 0: से।",
      hinglish:
        "Line {line} zero se divide kar rahi hai, jiska koi answer nahi hota. Divide karne se pehle number check karo, jaise if divisor != 0: se.",
    },
  },
  {
    id: "py-eof",
    languages: ["python"],
    pattern: /^EOFError: EOF when reading a line/,
    text: {
      en: "input() found nothing more to read. Type the program's input in the Input tab, one value per line.",
      hi: "input() को पढ़ने के लिए और कुछ नहीं मिला। Program का input, Input tab में लिखें, हर line में एक value।",
      hinglish:
        "input() ko padhne ke liye aur kuch nahi mila. Program ka input Input tab mein type karo, har line mein ek value.",
    },
  },

  // --- C and C++ ------------------------------------------------------------
  {
    id: "c-missing-semicolon",
    languages: C,
    pattern: /expected ';'/,
    text: {
      en: "A semicolon (;) is missing at the end of a statement, on line {line} or the line before. In C and C++ almost every statement ends with ;.",
      hi: "Line {line} पर या उससे पिछली line पर किसी statement के आखिर में semicolon (;) नहीं है। C और C++ में लगभग हर statement ; पर खत्म होता है।",
      hinglish:
        "Line {line} ya usse pichhli line par kisi statement ke end mein semicolon (;) missing hai. C aur C++ mein lagbhag har statement ; par khatam hota hai.",
    },
  },
  {
    id: "c-missing-include",
    languages: C,
    pattern: /call to undeclared library function '(\w+)'/,
    text: {
      en: "{1} comes from a library the program has not included. Add the #include line the note below names at the top, for example #include <stdio.h> for printf and scanf.",
      hi: "{1} एक library से आता है, जिसे program ने include नहीं किया है। नीचे वाले note में जो #include line बताई गई है, उसे program में सबसे ऊपर लिखें। जैसे printf और scanf के लिए #include <stdio.h> चाहिए।",
      hinglish:
        "{1} ek library se aata hai jo program mein include nahi hai. Neeche wale note mein jo #include line bataayi hai, use program mein sabse upar likho. Jaise printf aur scanf ke liye #include <stdio.h> chahiye.",
    },
  },
  {
    id: "c-undeclared-function",
    languages: C,
    pattern: /call to undeclared function '(\w+)'/,
    text: {
      en: "There is no function called {1} before line {line}. Check its spelling, or move the function above main.",
      hi: "Line {line} से पहले {1} नाम का कोई function नहीं है। इसकी spelling जाँचें, या उस function को main से ऊपर ले जाएँ।",
      hinglish:
        "Line {line} se pehle {1} naam ka koi function nahi hai. Spelling check karo, ya us function ko main ke upar le jao.",
    },
  },
  {
    id: "cpp-missing-std",
    languages: ["cpp"],
    pattern:
      /use of undeclared identifier '(cout|cin|endl|string)'; did you mean 'std::/,
    text: {
      en: "{1} belongs to the std namespace. Add using namespace std; below the #include lines, or write std::{1}.",
      hi: "{1}, std namespace का हिस्सा है। #include lines के नीचे using namespace std; लिखें, या std::{1} लिखें।",
      hinglish:
        "{1} std namespace ka hissa hai. #include lines ke neeche using namespace std; likho, ya std::{1} likho.",
    },
  },
  {
    id: "cpp-missing-iostream",
    languages: ["cpp"],
    pattern: /use of undeclared identifier '(cout|cin|endl)'/,
    text: {
      en: "{1} needs #include <iostream> at the top of the program, followed by using namespace std;.",
      hi: "{1} के लिए program में सबसे ऊपर #include <iostream> और उसके बाद using namespace std; चाहिए।",
      hinglish:
        "{1} ke liye program mein sabse upar #include <iostream> aur uske baad using namespace std; chahiye.",
    },
  },
  {
    id: "c-undeclared-identifier",
    languages: C,
    pattern: /use of undeclared identifier '(\w+)'/,
    text: {
      en: "{1} is used on line {line} but never declared. Declare it first with its type (for example int {1};) and check its spelling: capital letters count.",
      hi: "{1} को line {line} पर इस्तेमाल किया गया है, लेकिन कहीं declare नहीं किया गया। पहले इसे इसके type के साथ declare करें (जैसे int {1};) और spelling जाँचें: capital और small letters में फ़र्क होता है।",
      hinglish:
        "{1} line {line} par use hua hai, par kahin declare nahi kiya. Pehle ise type ke saath declare karo (jaise int {1};) aur spelling check karo: capital letters ka farak padta hai.",
    },
  },
  {
    id: "c-scanf-ampersand",
    languages: ["c"],
    pattern:
      /format specifies type '([\w ]+) \*' but the argument has type '\1'/,
    text: {
      en: 'scanf needs the address of the variable to store the value in: put & before the variable\'s name, as in scanf("%d", &number).',
      hi: 'scanf को value रखने के लिए variable का address चाहिए: variable के नाम से पहले & लगाएँ, जैसे scanf("%d", &number) में।',
      hinglish:
        'scanf ko value store karne ke liye variable ka address chahiye: variable ke naam se pehle & lagao, jaise scanf("%d", &number).',
    },
  },
  {
    id: "c-format-type",
    languages: C,
    pattern:
      /format specifies type '[\w ]+' but the argument has type '[\w ]+'/,
    text: {
      en: "The % code does not match the value: use %d for int, %f for float and double, %c for char and %s for text.",
      hi: "% code, value से मेल नहीं खाता: int के लिए %d, float और double के लिए %f, char के लिए %c और text के लिए %s इस्तेमाल करें।",
      hinglish:
        "% code value se match nahi karta: int ke liye %d, float aur double ke liye %f, char ke liye %c aur text ke liye %s use karo.",
    },
  },
  {
    id: "c-missing-type",
    languages: C,
    pattern:
      /type specifier missing, defaults to 'int'|a type specifier is required for all declarations/,
    text: {
      en: "Something on line {line} has no type. Write the type in front of it, for example int main() or int count = 0;.",
      hi: "Line {line} पर किसी चीज़ का type नहीं लिखा है। उसके आगे type लिखें, जैसे int main() या int count = 0;",
      hinglish:
        "Line {line} par kisi cheez ka type nahi likha. Uske aage type likho, jaise int main() ya int count = 0;.",
    },
  },
  {
    id: "c-array-past-end",
    languages: C,
    pattern:
      /array index (-?\d+) is (?:past the end|before the beginning) of the array/,
    text: {
      en: "Index {1} is outside the array. An array of size n has indexes 0 to n - 1.",
      hi: "Index {1} array के बाहर है। n size वाले array के indexes 0 से n - 1 तक होते हैं।",
      hinglish:
        "Index {1} array ke bahar hai. n size wale array ke indexes 0 se n - 1 tak hote hain.",
    },
  },
  {
    id: "c-memory-out-of-bounds",
    languages: C,
    pattern: /memory access out of bounds/,
    text: {
      en: "The program used memory it does not own: most often an array index past the end, or a pointer that was never set. Check each index against the array's size.",
      hi: "Program ने ऐसी memory इस्तेमाल की जो उसकी नहीं है: ज़्यादातर यह array के आखिर से आगे का index होता है, या ऐसा pointer जिसे कभी set नहीं किया गया। हर index को array के size से मिलाकर देखें।",
      hinglish:
        "Program ne aisi memory use ki jo uski nahi hai: zyada tar array ke end ke aage ka index, ya aisa pointer jise kabhi set nahi kiya. Har index ko array ke size se match karke dekho.",
    },
  },
  {
    id: "c-missing-brace",
    languages: C,
    pattern: /expected '\}'/,
    text: {
      en: "A closing brace } is missing. Every { needs a matching }; the note shows which { is still open.",
      hi: "एक closing brace } नहीं है। हर { के लिए एक } चाहिए; note में दिखाया गया है कि कौन सा { अभी खुला है।",
      hinglish:
        "Ek closing brace } missing hai. Har { ke liye ek } chahiye; note mein dikhaya hai ki kaunsa { abhi khula hai.",
    },
  },
  {
    id: "c-missing-return",
    languages: C,
    pattern: /non-void function does not return a value/,
    text: {
      en: "This function says it returns a value, but it can reach its end without a return. Add return with a value before the closing }.",
      hi: "यह function कहता है कि यह एक value return करेगा, लेकिन यह बिना return के अपने आखिर तक पहुँच सकता है। Closing } से पहले किसी value के साथ return लिखें।",
      hinglish:
        "Yeh function kehta hai ki value return karega, par yeh bina return ke end tak pahunch sakta hai. Closing } se pehle value ke saath return likho.",
    },
  },
  {
    id: "cpp-cin-operand",
    languages: ["cpp"],
    pattern: /invalid operands to binary expression \('(?:std::)?istream'/,
    text: {
      en: "cin >> can only read into a variable of the right type, such as int n; then cin >> n;. If you typed letters where a number is read, cin stops reading.",
      hi: "cin >> सिर्फ़ सही type के variable में पढ़ सकता है, जैसे पहले int n; और फिर cin >> n; लिखें। अगर आपने वहाँ letters लिखे जहाँ number पढ़ा जाता है, तो cin पढ़ना बंद कर देता है।",
      hinglish:
        "cin >> sirf sahi type ke variable mein padh sakta hai, jaise pehle int n; phir cin >> n;. Agar number ki jagah letters type kiye, toh cin padhna band kar deta hai.",
    },
  },

  // --- Java ------------------------------------------------------------------
  {
    id: "java-missing-semicolon",
    languages: ["java"],
    pattern: /';' expected/,
    text: {
      en: "A semicolon (;) is missing at the end of the statement on line {line}. In Java, statements end with ;.",
      hi: "Line {line} के statement के आखिर में semicolon (;) नहीं है। Java में statements ; पर खत्म होते हैं।",
      hinglish:
        "Line {line} ke statement ke end mein semicolon (;) missing hai. Java mein statements ; par khatam hote hain.",
    },
  },
  {
    id: "java-cannot-find-symbol",
    languages: ["java"],
    pattern: /cannot find symbol/,
    text: {
      en: "Java does not know a name used on line {line}. Check its spelling and capital letters, that the variable is declared, and that classes you use are imported (Scanner needs import java.util.Scanner;).",
      hi: "Line {line} पर इस्तेमाल किया गया कोई नाम Java नहीं पहचानता। Spelling और capital letters जाँचें, देखें कि variable declare किया गया है, और जो classes आप इस्तेमाल कर रहे हैं वे import की गई हैं (Scanner के लिए import java.util.Scanner; चाहिए)।",
      hinglish:
        "Line {line} par use hua koi naam Java nahi jaanta. Spelling aur capital letters check karo, dekho ki variable declare hua hai, aur jo classes use kar rahe ho woh import ki hain (Scanner ke liye import java.util.Scanner; chahiye).",
    },
  },
  {
    id: "java-public-class-file",
    languages: ["java"],
    pattern:
      /class (\w+) is public, should be declared in a file named \1\.java/,
    text: {
      en: "A public class must be in a file with the same name. Keep one public class, the one with main, and name it after the file (here, Main).",
      hi: "हर public class अपने ही नाम वाली file में होनी चाहिए। सिर्फ़ एक public class रखें, वही जिसमें main है, और उसका नाम file के नाम पर रखें (यहाँ, Main)।",
      hinglish:
        "Har public class apne hi naam wali file mein honi chahiye. Sirf ek public class rakho, wahi jisme main hai, aur uska naam file ke naam jaisa rakho (yahan, Main).",
    },
  },
  {
    id: "java-incompatible-types",
    languages: ["java"],
    pattern: /incompatible types: (\S+) cannot be converted to (\S+)/,
    text: {
      en: "A {1} value cannot be stored in a {2} variable. Convert it first, for example Integer.parseInt(text) turns text into an int.",
      hi: "{1} value को {2} variable में नहीं रखा जा सकता। पहले इसे बदलें, जैसे Integer.parseInt(text) text को int में बदलता है।",
      hinglish:
        "{1} value ko {2} variable mein store nahi kar sakte. Pehle use convert karo, jaise Integer.parseInt(text) text ko int mein badalta hai.",
    },
  },
  {
    id: "java-missing-return",
    languages: ["java"],
    pattern: /missing return statement/,
    text: {
      en: "This method says it returns a value, but it can reach its end without a return. Add return with a value before the closing }.",
      hi: "यह method कहता है कि यह एक value return करेगा, लेकिन यह बिना return के अपने आखिर तक पहुँच सकता है। Closing } से पहले किसी value के साथ return लिखें।",
      hinglish:
        "Yeh method kehta hai ki value return karega, par yeh bina return ke end tak pahunch sakta hai. Closing } se pehle value ke saath return likho.",
    },
  },
  {
    id: "java-input-mismatch",
    languages: ["java"],
    pattern: /InputMismatchException/,
    text: {
      en: "Scanner expected a number but found something else in the Input tab. Check that the input matches what the program reads: nextInt() reads a whole number.",
      hi: "Scanner को number चाहिए था, लेकिन Input tab में कुछ और मिला। देखें कि input वैसा ही है जैसा program पढ़ता है: nextInt() एक whole number पढ़ता है।",
      hinglish:
        "Scanner ko number chahiye tha, par Input tab mein kuch aur mila. Check karo ki input wahi hai jo program padhta hai: nextInt() whole number padhta hai.",
    },
  },
  {
    id: "java-array-index",
    languages: ["java"],
    pattern:
      /ArrayIndexOutOfBoundsException(?:: Index (-?\d+) out of bounds for length (\d+))?/,
    text: {
      en: "The program used an index outside the array. An array of length n has indexes 0 to n - 1.",
      hi: "Program ने array के बाहर का index इस्तेमाल किया। n length वाले array के indexes 0 से n - 1 तक होते हैं।",
      hinglish:
        "Program ne array ke bahar ka index use kiya. n length wale array ke indexes 0 se n - 1 tak hote hain.",
    },
  },
  {
    id: "java-null-pointer",
    languages: ["java"],
    pattern: /NullPointerException/,
    text: {
      en: "The program used an object that does not exist yet (null), such as a variable that was never given a value with new.",
      hi: "Program ने ऐसा object इस्तेमाल किया जो अभी बना ही नहीं है (null), जैसे कोई variable जिसे कभी new से value नहीं दी गई।",
      hinglish:
        "Program ne aisa object use kiya jo abhi bana hi nahi hai (null), jaise koi variable jise kabhi new se value nahi di gayi.",
    },
  },
  {
    id: "java-divide-by-zero",
    languages: ["java"],
    pattern: /ArithmeticException: \/ by zero/,
    text: {
      en: "The program divided a whole number by zero, which has no answer. Check the number before dividing, for example with if (divisor != 0).",
      hi: "Program ने किसी पूरी संख्या को zero से भाग दिया, जिसका कोई जवाब नहीं होता। भाग देने से पहले संख्या जाँचें, जैसे if (divisor != 0) से।",
      hinglish:
        "Program ne kisi whole number ko zero se divide kiya, jiska koi answer nahi hota. Divide karne se pehle number check karo, jaise if (divisor != 0) se.",
    },
  },
  {
    id: "java-no-input",
    languages: ["java"],
    pattern: /NoSuchElementException/,
    text: {
      en: "Scanner found nothing more to read. Type the program's input in the Input tab, with a value for every nextInt(), next() and nextLine().",
      hi: "Scanner को पढ़ने के लिए और कुछ नहीं मिला। Program का input Input tab में लिखें, हर nextInt(), next() और nextLine() के लिए एक value।",
      hinglish:
        "Scanner ko padhne ke liye aur kuch nahi mila. Program ka input Input tab mein likho, har nextInt(), next() aur nextLine() ke liye ek value.",
    },
  },
  {
    id: "java-stack-overflow",
    languages: ["java"],
    pattern: /StackOverflowError/,
    text: {
      en: "A method kept calling itself and never stopped. A recursive method needs a base case: a condition where it returns without calling itself again.",
      hi: "एक method खुद को बार-बार call करता रहा और कभी रुका नहीं। Recursive method को एक base case चाहिए: ऐसी condition जहाँ वह खुद को फिर से call किए बिना return करे।",
      hinglish:
        "Ek method khud ko baar-baar call karta raha aur kabhi ruka nahi. Recursive method ko ek base case chahiye: aisi condition jahan woh khud ko dobara call kiye bina return kare.",
    },
  },

  // --- JavaScript and TypeScript ----------------------------------------------
  {
    id: "js-not-defined",
    languages: ["javascript", "typescript"],
    pattern: /^ReferenceError: (\w+) is not defined/,
    text: {
      en: "{1} is not defined. Check its spelling, and that you declared it with let or const before line {line}.",
      hi: "{1} define नहीं है। इसकी spelling जाँचें, और देखें कि आपने line {line} से पहले इसे let या const से declare किया है।",
      hinglish:
        "{1} define nahi hai. Spelling check karo, aur dekho ki line {line} se pehle ise let ya const se declare kiya hai.",
    },
  },
  {
    id: "js-property-of-nothing",
    languages: ["javascript", "typescript"],
    pattern:
      /^TypeError: Cannot read properties of (undefined|null) \(reading '([^']+)'\)/,
    text: {
      en: "Line {line} reads {2} from a value that is {1}: the variable has no object in it yet. Check where it gets its value.",
      hi: "Line {line} ऐसी value से {2} पढ़ रही है जो {1} है: variable में अभी कोई object नहीं है। देखें कि उसे value कहाँ से मिलती है।",
      hinglish:
        "Line {line} ek {1} value se {2} padh rahi hai: variable mein abhi koi object nahi hai. Dekho ki use value kahan se milti hai.",
    },
  },

  // --- Every language -----------------------------------------------------------
  {
    id: "timeout",
    languages: "any",
    pattern: /timed out after/,
    text: {
      en: "The program ran past the time limit, so it was stopped. A loop whose condition never becomes false runs forever: check that each loop changes the variable in its condition. (Settings has the time limit.)",
      hi: "Program समय सीमा से ज़्यादा चला, इसलिए उसे रोक दिया गया। जिस loop की condition कभी false नहीं होती, वह हमेशा चलता रहता है: देखें कि हर loop अपनी condition वाले variable को बदलता है। (समय सीमा Settings में है।)",
      hinglish:
        "Program time limit se zyada chala, isliye use rok diya gaya. Jis loop ki condition kabhi false nahi hoti, woh hamesha chalta rehta hai: check karo ki har loop apni condition wale variable ko badalta hai. (Time limit Settings mein hai.)",
    },
  },
];
