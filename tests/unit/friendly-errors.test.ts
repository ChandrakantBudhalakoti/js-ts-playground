import { describe, expect, it } from "vitest";
import { explainError, RULES } from "@/lib/friendly-errors";
import { LOCALES } from "@/lib/i18n";
import { en } from "@/lib/i18n/messages/en";
import { hi } from "@/lib/i18n/messages/hi";
import { hinglish } from "@/lib/i18n/messages/hinglish";

const placeholders = (text: string) =>
  (text.match(/\{\w+\}/g) ?? []).toSorted().join(" ");

describe("interface translations", () => {
  it.each([
    ["hi", hi],
    ["hinglish", hinglish],
  ] as const)(
    "%s has every message, with the same placeholders",
    (_, messages) => {
      expect(Object.keys(messages).toSorted()).toEqual(
        Object.keys(en).toSorted(),
      );
      for (const [key, text] of Object.entries(en)) {
        const translated = messages[key as keyof typeof en];
        expect(translated, key).toBeTruthy();
        expect(placeholders(translated), key).toBe(placeholders(text));
      }
    },
  );
});

describe("friendly error rules", () => {
  it("have unique ids and every language's text, with the same placeholders", () => {
    const ids = RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of RULES) {
      for (const { id } of LOCALES) {
        expect(rule.text[id], `${rule.id} ${id}`).toBeTruthy();
        expect(placeholders(rule.text[id]), `${rule.id} ${id}`).toBe(
          placeholders(rule.text.en),
        );
      }
    }
  });

  // Messages as the runtimes and compilers really print them.
  const CASES: [Parameters<typeof explainError>[0], string, string][] = [
    ["python", "IndentationError: unexpected indent", "py-unexpected-indent"],
    [
      "python",
      "IndentationError: expected an indented block after 'if' statement on line 2",
      "py-expected-indent",
    ],
    ["python", "SyntaxError: expected ':'", "py-missing-colon"],
    ["python", "SyntaxError: '(' was never closed", "py-unclosed-bracket"],
    ["python", "NameError: name 'totl' is not defined", "py-name-error"],
    [
      "python",
      'TypeError: can only concatenate str (not "int") to str',
      "py-str-plus-number",
    ],
    [
      "python",
      "TypeError: unsupported operand type(s) for +: 'int' and 'str'",
      "py-str-plus-number",
    ],
    [
      "python",
      "ValueError: invalid literal for int() with base 10: 'abc'",
      "py-int-from-text",
    ],
    ["python", "IndexError: list index out of range", "py-index-error"],
    ["python", "ZeroDivisionError: division by zero", "py-zero-division"],
    ["python", "EOFError: EOF when reading a line", "py-eof"],
    ["c", "expected ';' at end of declaration", "c-missing-semicolon"],
    ["c", "expected ';' after expression", "c-missing-semicolon"],
    [
      "c",
      "call to undeclared library function 'printf' with type 'int (const char *, ...)'; ISO C99 and later do not support implicit function declarations",
      "c-missing-include",
    ],
    ["c", "use of undeclared identifier 'count'", "c-undeclared-identifier"],
    [
      "c",
      "format specifies type 'int *' but the argument has type 'int'",
      "c-scanf-ampersand",
    ],
    [
      "c",
      "format specifies type 'int' but the argument has type 'double'",
      "c-format-type",
    ],
    [
      "c",
      "type specifier missing, defaults to 'int'; ISO C99 and later do not support implicit int",
      "c-missing-type",
    ],
    [
      "c",
      "array index 5 is past the end of the array (that has type 'int[3]')",
      "c-array-past-end",
    ],
    [
      "c",
      "RuntimeError: memory access out of bounds",
      "c-memory-out-of-bounds",
    ],
    ["c", "expected '}'", "c-missing-brace"],
    [
      "cpp",
      "use of undeclared identifier 'cout'; did you mean 'std::cout'?",
      "cpp-missing-std",
    ],
    ["cpp", "use of undeclared identifier 'cout'", "cpp-missing-iostream"],
    [
      "cpp",
      "a type specifier is required for all declarations",
      "c-missing-type",
    ],
    ["cpp", "non-void function does not return a value", "c-missing-return"],
    [
      "cpp",
      "invalid operands to binary expression ('istream' (aka 'basic_istream<char>') and 'const char[2]')",
      "cpp-cin-operand",
    ],
    ["java", "';' expected", "java-missing-semicolon"],
    ["java", "cannot find symbol", "java-cannot-find-symbol"],
    [
      "java",
      "class Hello is public, should be declared in a file named Hello.java",
      "java-public-class-file",
    ],
    [
      "java",
      "incompatible types: String cannot be converted to int",
      "java-incompatible-types",
    ],
    ["java", "java.util.InputMismatchException", "java-input-mismatch"],
    [
      "java",
      "java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 3",
      "java-array-index",
    ],
    ["java", "java.lang.ArithmeticException: / by zero", "java-divide-by-zero"],
    [
      "java",
      "java.util.NoSuchElementException: No line found",
      "java-no-input",
    ],
    ["java", "java.lang.StackOverflowError", "java-stack-overflow"],
    ["javascript", "ReferenceError: totl is not defined", "js-not-defined"],
    [
      "typescript",
      "TypeError: Cannot read properties of undefined (reading 'length')",
      "js-property-of-nothing",
    ],
    ["python", "timed out after 5.00 s", "timeout"],
    ["c", "timed out after 2.00 s", "timeout"],
  ];

  it.each(CASES)("%s: %s", (language, error, id) => {
    expect(explainError(language, error, 4, "en")?.id).toBe(id);
  });

  it("fills in the line and the matched names", () => {
    expect(
      explainError("python", "IndentationError: unexpected indent", 4, "en")
        ?.text,
    ).toContain("Line 4");
    expect(
      explainError("python", "NameError: name 'totl' is not defined", 2, "en")
        ?.text,
    ).toContain("totl");
  });

  it("answers in the interface language", () => {
    const error = "ZeroDivisionError: division by zero";
    const rule = RULES.find((r) => r.id === "py-zero-division")!;
    expect(explainError("python", error, 3, "hi")?.text).toBe(
      rule.text.hi.replaceAll("{line}", "3"),
    );
  });

  it("only explains errors of the rule's languages, and nothing it doesn't know", () => {
    expect(
      explainError("python", "expected ';' after expression", 1, "en"),
    ).toBeNull();
    expect(
      explainError("python", "SomethingElse: no idea", 1, "en"),
    ).toBeNull();
  });
});
