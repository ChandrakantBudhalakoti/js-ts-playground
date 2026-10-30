import type { Program } from "../types";

export const program: Program = {
  slug: "hello-world",
  level: "beginner",
  topic: "Basics",
  name: "Hello World",
  summary: "Your first program: print a line of text",
  heading: "Hello World Program in {language}",
  description:
    "The Hello World program in {language}, explained line by line for beginners. Run it in your browser on a phone or PC, then change the message.",
  explanation: [
    "Almost every programmer starts here. This program prints a message on the screen, and nothing else. It shows the smallest complete program you can write, and how to make a program show text.",
    "Text inside double quotes is called a string. The print instruction sends it to the output, which appears in the Console when you press Run.",
  ],
  steps: [
    "The program starts running at the top (in C, C++ and Java, inside main).",
    "The print instruction shows the text between the quotes.",
    "The second print shows another line: each print starts on a new line.",
  ],
  notes: {
    c: [
      "#include <stdio.h> gives the program printf. The \\n at the end of the text moves to a new line.",
      "return 0; tells the system the program finished without errors.",
    ],
    cpp: [
      "cout << sends text to the output; endl ends the line.",
      "using namespace std; lets you write cout instead of std::cout.",
    ],
    java: [
      "Every Java program lives inside a class. Here it is called Main, and the program starts in its main method.",
      "System.out.println prints the text and then moves to a new line.",
    ],
  },
  output: "Hello, World!\nWelcome to programming.",
  code: {
    python: String.raw`# print() shows the text inside the brackets.
print("Hello, World!")
print("Welcome to programming.")
`,
    c: String.raw`#include <stdio.h>  // gives us printf

// Every C program starts in main.
int main(void) {
    printf("Hello, World!\n");  // \n moves to a new line
    printf("Welcome to programming.\n");
    return 0;  // 0 means "finished without errors"
}
`,
    cpp: String.raw`#include <iostream>  // gives us cout
using namespace std;

// Every C++ program starts in main.
int main() {
    cout << "Hello, World!" << endl;  // endl ends the line
    cout << "Welcome to programming." << endl;
    return 0;
}
`,
    java: String.raw`// Every Java program lives in a class; this one is called Main.
public class Main {
    // The program starts in the main method.
    public static void main(String[] args) {
        System.out.println("Hello, World!");  // prints a line
        System.out.println("Welcome to programming.");
    }
}
`,
  },
};
