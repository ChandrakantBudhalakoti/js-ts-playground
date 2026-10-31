import type { Program } from "../types";

export const program: Program = {
  slug: "input-output",
  level: "beginner",
  topic: "Basics",
  name: "Input and output",
  summary: "Reads a name and an age, then prints a greeting",
  heading: "How to Take Input and Print Output in {language}",
  description:
    "How to take input from the user and print output in {language}, with a simple program that reads a name and age. Run it online in your browser.",
  explanation: [
    "Most programs need information from the person using them. This program asks for your name and your age, reads what you type, and then prints a greeting with your name and the age you will be next year.",
    "What you type in is called input, and what the program prints is called output. Everything you type arrives as text, so the program turns the age into a whole number before it adds 1: type 15 and it prints 16. In the playground, type your input in the Input tab before you press Run.",
  ],
  steps: [
    "The program prints a line asking for your name.",
    "It reads the whole line you typed, spaces included, and keeps it in a variable called name.",
    "It asks for your age and reads it as a whole number into a variable called age.",
    "It prints a greeting with your name.",
    "It adds 1 to the age and prints the result.",
  ],
  notes: {
    python: [
      "input() reads one line of text. int() turns that text into a whole number, so you can do maths with it.",
      'The f before the quotes in f"Hello, {name}!" makes an f-string: each name in curly brackets is replaced by its value.',
    ],
    c: [
      'The & in scanf("%d", &age) gives scanf the address of age (the place in memory where it is kept), so scanf can store the number there. Without the &, the program can crash.',
      "fgets reads a whole line, and keeps the Enter key (a newline) at the end of it. The strcspn line finds that newline and removes it.",
    ],
    cpp: [
      'getline(cin, name) reads a whole line, spaces included. cin >> name would stop at the first space and read only "Asha".',
    ],
    java: [
      "nextLine() reads a whole line, spaces included. nextInt() reads one whole number.",
      "The brackets in (age + 1) make Java add the numbers first. Without them, Java would join 15 and 1 as text and print 151.",
    ],
  },
  stdin: "Asha Rao\n15\n",
  output:
    "Enter your name:\nEnter your age:\nHello, Asha Rao!\nNext year you will be 16 years old.",
  code: {
    python: String.raw`# Ask for the name and read the whole line, spaces included.
print("Enter your name:")
name = input()

# Ask for the age. int() turns the typed text into a whole number.
print("Enter your age:")
age = int(input())

# Print a greeting, then the age next year.
print(f"Hello, {name}!")
print(f"Next year you will be {age + 1} years old.")
`,
    c: String.raw`#include <stdio.h>   // gives us printf, scanf and fgets
#include <string.h>  // gives us strcspn

int main(void) {
    char name[100];  // room for a name of up to 99 letters
    int age;         // a whole number

    // Ask for the name and read the whole line, spaces included.
    printf("Enter your name:\n");
    fgets(name, sizeof(name), stdin);
    name[strcspn(name, "\n")] = '\0';  // remove the newline at the end

    // Ask for the age and read one whole number.
    printf("Enter your age:\n");
    scanf("%d", &age);  // & tells scanf where age is kept

    // Print a greeting, then the age next year.
    printf("Hello, %s!\n", name);  // %s is replaced by the name
    printf("Next year you will be %d years old.\n", age + 1);  // %d by a number
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
#include <string>    // gives us string, for text
using namespace std;

int main() {
    string name;  // text
    int age;      // a whole number

    // Ask for the name and read the whole line, spaces included.
    cout << "Enter your name:" << endl;
    getline(cin, name);

    // Ask for the age and read one whole number.
    cout << "Enter your age:" << endl;
    cin >> age;

    // Print a greeting, then the age next year.
    cout << "Hello, " << name << "!" << endl;
    cout << "Next year you will be " << age + 1 << " years old." << endl;
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // gives us Scanner, which reads input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Ask for the name and read the whole line, spaces included.
        System.out.println("Enter your name:");
        String name = sc.nextLine();

        // Ask for the age and read one whole number.
        System.out.println("Enter your age:");
        int age = sc.nextInt();

        // Print a greeting, then the age next year.
        System.out.println("Hello, " + name + "!");
        System.out.println("Next year you will be " + (age + 1) + " years old.");
    }
}
`,
  },
};
