import type { Program } from "../types";

export const program: Program = {
  slug: "string-reverse-vowels",
  level: "beginner",
  topic: "Strings",
  name: "Reverse a string and count vowels",
  summary: "Reverses a line of text and counts its vowels",
  heading: "Reverse a String and Count Vowels in {language}",
  description:
    "{language} program to reverse a string and count its vowels using a loop. Explained line by line for beginners; run it online in your browser.",
  explanation: [
    "A string is a piece of text, stored as a row of characters (letters, digits, spaces and symbols), each in its own numbered position. This program reads a line of text, prints it backwards and counts how many vowels it has.",
    'To reverse the text, the program takes the characters from the last position back to the first. To count the vowels, it looks at each character in turn and adds 1 to a counter whenever it is a, e, i, o or u, small or capital. "Learning to code" has 6 vowels: e, a, i, o, o and e.',
  ],
  steps: [
    "The program reads a whole line of text, spaces included.",
    "A loop goes from the last character back to the first, so the characters come out in reverse order.",
    "A second loop visits every character and adds 1 to the vowel count when the character is a vowel, small or capital.",
    "The program prints the reversed text and the number of vowels.",
  ],
  notes: {
    python: [
      "range(len(text) - 1, -1, -1) counts down from the last position to 0: it stops just before the middle number (-1), and the last -1 means go down by 1 each time.",
      "text[::-1] reverses a string in one step, but the loop shows how reversing works.",
    ],
    c: [
      "fgets reads a whole line, spaces included, but keeps the newline from the Enter key at the end. The program replaces it with '\\0', the mark that ends every C string.",
      "A C string cannot grow, so instead of building a reversed copy the program prints the characters one by one, from the last to the first.",
    ],
    cpp: [
      "cin >> text would stop at the first space; getline(cin, text) reads the whole line.",
      "text[i] is a single character. reversed + text[i] makes a new string with that character added at the end.",
    ],
    java: [
      "sc.nextLine() reads the whole line; sc.next() would read only the first word.",
      "text.charAt(i) gives the character at position i, counting from 0, and text.length() gives the number of characters.",
    ],
  },
  stdin: "Learning to code\n",
  output:
    "Enter a line of text:\nReversed: edoc ot gninraeL\nNumber of vowels: 6",
  code: {
    python: String.raw`# Read a whole line of text, spaces included.
print("Enter a line of text:")
text = input()

# Build the reversed text, from the last character back to the first.
reversed_text = ""
for i in range(len(text) - 1, -1, -1):  # i counts down to 0
    reversed_text = reversed_text + text[i]
print("Reversed:", reversed_text)

# Count the vowels: look at each character in turn.
vowel_count = 0
for character in text:
    if character in "aeiouAEIOU":  # a vowel, small or capital
        vowel_count = vowel_count + 1
print("Number of vowels:", vowel_count)
`,
    c: String.raw`#include <stdio.h>   // gives us printf and fgets
#include <string.h>  // gives us strlen

int main(void) {
    char text[200] = "";  // room for one line of text, empty to start

    // Read a whole line of text, spaces included.
    printf("Enter a line of text:\n");
    fgets(text, sizeof(text), stdin);

    // fgets keeps the newline from the Enter key: remove it.
    int length = strlen(text);
    if (length > 0 && text[length - 1] == '\n') {
        text[length - 1] = '\0';  // '\0' marks the end of a string
        length = length - 1;
    }

    // Print the characters from the last one back to the first.
    printf("Reversed: ");
    for (int i = length - 1; i >= 0; i--) {
        printf("%c", text[i]);
    }
    printf("\n");

    // Count the vowels: look at each character in turn.
    int vowelCount = 0;
    for (int i = 0; i < length; i++) {
        char letter = text[i];
        // Is it a vowel, small or capital?
        if (letter == 'a' || letter == 'e' || letter == 'i' ||
            letter == 'o' || letter == 'u' ||
            letter == 'A' || letter == 'E' || letter == 'I' ||
            letter == 'O' || letter == 'U') {
            vowelCount = vowelCount + 1;
        }
    }
    printf("Number of vowels: %d\n", vowelCount);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
#include <string>    // gives us string and getline
using namespace std;

int main() {
    string text;

    // Read a whole line of text, spaces included.
    cout << "Enter a line of text:" << endl;
    getline(cin, text);
    int length = text.length();

    // Build the reversed text, from the last character back to the first.
    string reversed = "";
    for (int i = length - 1; i >= 0; i--) {
        reversed = reversed + text[i];
    }
    cout << "Reversed: " << reversed << endl;

    // Count the vowels: look at each character in turn.
    int vowelCount = 0;
    for (int i = 0; i < length; i++) {
        char letter = text[i];
        // Is it a vowel, small or capital?
        if (letter == 'a' || letter == 'e' || letter == 'i' ||
            letter == 'o' || letter == 'u' ||
            letter == 'A' || letter == 'E' || letter == 'I' ||
            letter == 'O' || letter == 'U') {
            vowelCount = vowelCount + 1;
        }
    }
    cout << "Number of vowels: " << vowelCount << endl;
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets the program read input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Read a whole line of text, spaces included.
        System.out.println("Enter a line of text:");
        String text = sc.nextLine();

        // Build the reversed text, from the last character back to the first.
        String reversed = "";
        for (int i = text.length() - 1; i >= 0; i--) {
            reversed = reversed + text.charAt(i);
        }
        System.out.println("Reversed: " + reversed);

        // Count the vowels: look at each character in turn.
        int vowelCount = 0;
        for (int i = 0; i < text.length(); i++) {
            char letter = text.charAt(i);
            // Is it a vowel, small or capital?
            if (letter == 'a' || letter == 'e' || letter == 'i' ||
                letter == 'o' || letter == 'u' ||
                letter == 'A' || letter == 'E' || letter == 'I' ||
                letter == 'O' || letter == 'U') {
                vowelCount = vowelCount + 1;
            }
        }
        System.out.println("Number of vowels: " + vowelCount);
    }
}
`,
  },
};
