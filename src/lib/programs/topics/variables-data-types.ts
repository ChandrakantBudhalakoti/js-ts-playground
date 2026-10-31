import type { Program } from "../types";

export const program: Program = {
  slug: "variables-data-types",
  level: "beginner",
  topic: "Basics",
  name: "Variables and data types",
  summary: "Stores numbers, text and true/false values in variables",
  heading: "Variables and Data Types in {language}",
  description:
    "Variables and data types in {language} for beginners: whole numbers, decimals, characters, text and true/false, plus integer division. Run it online.",
  explanation: [
    "A variable is a named box that holds a value, such as a student's age or name. The kind of value it holds is called its data type: a whole number (an integer), a decimal number, a single character like the letter A, a piece of text (a string), or a true/false value (a boolean). This program makes one variable of each kind and prints them with labels.",
    "The data type changes how maths works. When you divide one whole number by another, the answer is also a whole number and the remainder is dropped: 7 divided by 2 is 3 (with 1 left over, which is thrown away). If one of the numbers is a decimal, such as 7.0, the answer keeps its decimal part: 3.5.",
  ],
  steps: [
    "The program creates five variables: a name (text), an age (whole number), a percentage (decimal), a grade (one character) and passed (true or false).",
    "It prints each value after a label, such as Name: or Age:.",
    "It checks passed with if-else and prints yes or no.",
    "It divides 7 by 2 as whole numbers, which gives 3, and prints it.",
    "It divides 7.0 by 2, which keeps the decimal part, and prints 3.5.",
  ],
  notes: {
    python: [
      "In Python, / always gives a decimal answer (7 / 2 is 3.5). Use // when you want whole-number division (7 // 2 is 3).",
      'Python has no separate type for one character: "A" is simply text that is one letter long. True and False start with a capital letter.',
    ],
    c: [
      "C has no string type: text is kept in an array of characters, char name[]. A single character goes in single quotes ('A'), text in double quotes (\"Asha\").",
      "bool, true and false come from #include <stdbool.h>. In printf, %d prints an int, %.1f a decimal with 1 digit after the point, %c a character and %s text.",
    ],
    cpp: [
      "cout would print true as 1 and false as 0, which is why the program chooses the words yes and no itself.",
    ],
    java: [
      "String starts with a capital S, and Java's true/false type is called boolean. A char goes in single quotes ('A').",
      'The + in println joins text and values together, so "Age: " + age prints Age: 15.',
    ],
  },
  output:
    "Name: Asha\nAge: 15\nPercentage: 87.5\nGrade: A\nPassed: yes\nWhole number division of 7 by 2: 3\nDecimal division of 7 by 2: 3.5",
  code: {
    python: String.raw`# A variable is a named box that holds a value.
name = "Asha"      # text (a string)
age = 15           # a whole number (an int)
percentage = 87.5  # a decimal number (a float)
grade = "A"        # a single character
passed = True      # True or False (a bool)

# Print each value after a label.
print(f"Name: {name}")
print(f"Age: {age}")
print(f"Percentage: {percentage}")
print(f"Grade: {grade}")

# Choose the words to print for True or False.
if passed:
    print("Passed: yes")
else:
    print("Passed: no")

# // divides whole numbers and drops the remainder.
whole_answer = 7 // 2
print(f"Whole number division of 7 by 2: {whole_answer}")

# / gives the exact answer, with its decimal part.
decimal_answer = 7 / 2
print(f"Decimal division of 7 by 2: {decimal_answer}")
`,
    c: String.raw`#include <stdio.h>    // gives us printf
#include <stdbool.h>  // gives us bool, true and false

int main(void) {
    // A variable is a named box that holds a value of one type.
    char name[] = "Asha";      // text: an array of characters
    int age = 15;              // a whole number
    double percentage = 87.5;  // a decimal number
    char grade = 'A';          // a single character, in single quotes
    bool passed = true;        // true or false

    // Print each value after a label. Each %-code is replaced by a value.
    printf("Name: %s\n", name);                // %s for text
    printf("Age: %d\n", age);                  // %d for a whole number
    printf("Percentage: %.1f\n", percentage);  // %.1f: 1 digit after the point
    printf("Grade: %c\n", grade);              // %c for one character

    // C cannot print true or false as words, so we choose the words.
    if (passed) {
        printf("Passed: yes\n");
    } else {
        printf("Passed: no\n");
    }

    // Dividing two whole numbers drops the remainder.
    int whole_answer = 7 / 2;
    printf("Whole number division of 7 by 2: %d\n", whole_answer);

    // With a decimal number (7.0), the answer keeps its decimal part.
    double decimal_answer = 7.0 / 2;
    printf("Decimal division of 7 by 2: %.1f\n", decimal_answer);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cout
#include <string>    // gives us string, for text
using namespace std;

int main() {
    // A variable is a named box that holds a value of one type.
    string name = "Asha";      // text
    int age = 15;              // a whole number
    double percentage = 87.5;  // a decimal number
    char grade = 'A';          // a single character, in single quotes
    bool passed = true;        // true or false

    // Print each value after a label.
    cout << "Name: " << name << endl;
    cout << "Age: " << age << endl;
    cout << "Percentage: " << percentage << endl;
    cout << "Grade: " << grade << endl;

    // cout would print true as 1, so we choose the words.
    if (passed) {
        cout << "Passed: yes" << endl;
    } else {
        cout << "Passed: no" << endl;
    }

    // Dividing two whole numbers drops the remainder.
    int wholeAnswer = 7 / 2;
    cout << "Whole number division of 7 by 2: " << wholeAnswer << endl;

    // With a decimal number (7.0), the answer keeps its decimal part.
    double decimalAnswer = 7.0 / 2;
    cout << "Decimal division of 7 by 2: " << decimalAnswer << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    public static void main(String[] args) {
        // A variable is a named box that holds a value of one type.
        String name = "Asha";      // text
        int age = 15;              // a whole number
        double percentage = 87.5;  // a decimal number
        char grade = 'A';          // a single character, in single quotes
        boolean passed = true;     // true or false

        // Print each value after a label.
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        System.out.println("Percentage: " + percentage);
        System.out.println("Grade: " + grade);

        // Choose the words to print for true or false.
        if (passed) {
            System.out.println("Passed: yes");
        } else {
            System.out.println("Passed: no");
        }

        // Dividing two whole numbers drops the remainder.
        int wholeAnswer = 7 / 2;
        System.out.println("Whole number division of 7 by 2: " + wholeAnswer);

        // With a decimal number (7.0), the answer keeps its decimal part.
        double decimalAnswer = 7.0 / 2;
        System.out.println("Decimal division of 7 by 2: " + decimalAnswer);
    }
}
`,
  },
};
