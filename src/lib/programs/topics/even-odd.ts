import type { Program } from "../types";

export const program: Program = {
  slug: "even-odd",
  level: "beginner",
  topic: "Decisions",
  name: "Even or odd",
  summary: "Checks whether a number is even or odd",
  heading: "Even or Odd Program in {language}",
  description:
    "Check if a number is even or odd in {language} using if-else and the % (remainder) operator, explained for beginners. Run it online in your browser.",
  explanation: [
    "This program reads a whole number and tells you whether it is even or odd. It is often the first program that makes a decision: it does one thing if a condition is true and something else if it is not.",
    "A number is even if it divides by 2 with nothing left over, and odd if 1 is left over. The % operator gives the remainder after dividing: 8 % 2 is 0, so 8 is even; 7 % 2 is 1 (7 is 3 twos with 1 left over), so 7 is odd. An if-else checks whether the remainder is 0 and prints the matching message.",
  ],
  steps: [
    "The program asks for a number and reads it as a whole number.",
    "It works out the remainder when the number is divided by 2, using %.",
    "If the remainder is 0, the if part runs and prints that the number is even.",
    "Otherwise the else part runs and prints that the number is odd.",
  ],
  notes: {
    python: [
      "Python uses indentation (the spaces at the start of a line) to show which lines belong to the if and which to the else. Don't forget the colon at the end of the if and else lines.",
      "== asks whether two values are equal; a single = stores a value in a variable.",
    ],
    c: [
      "The lines that belong to the if and to the else go inside curly brackets { }.",
      "== asks whether two values are equal; a single = stores a value in a variable. Writing = by mistake inside an if is a common bug.",
    ],
    cpp: [
      "The lines that belong to the if and to the else go inside curly brackets { }.",
    ],
    java: [
      "nextInt() reads the next whole number from the Input tab.",
      "The lines that belong to the if and to the else go inside curly brackets { }.",
    ],
  },
  stdin: "7\n",
  output: "Enter a number:\n7 is odd",
  code: {
    python: String.raw`# Ask for a number and read it as a whole number.
print("Enter a number:")
number = int(input())

# % gives the remainder after dividing by 2.
# Even numbers leave a remainder of 0.
if number % 2 == 0:
    print(f"{number} is even")
else:
    print(f"{number} is odd")
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int number;

    // Ask for a number and read it.
    printf("Enter a number:\n");
    scanf("%d", &number);

    // % gives the remainder after dividing by 2.
    // Even numbers leave a remainder of 0.
    if (number % 2 == 0) {
        printf("%d is even\n", number);
    } else {
        printf("%d is odd\n", number);
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int number;

    // Ask for a number and read it.
    cout << "Enter a number:" << endl;
    cin >> number;

    // % gives the remainder after dividing by 2.
    // Even numbers leave a remainder of 0.
    if (number % 2 == 0) {
        cout << number << " is even" << endl;
    } else {
        cout << number << " is odd" << endl;
    }
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // gives us Scanner, which reads input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Ask for a number and read it.
        System.out.println("Enter a number:");
        int number = sc.nextInt();

        // % gives the remainder after dividing by 2.
        // Even numbers leave a remainder of 0.
        if (number % 2 == 0) {
            System.out.println(number + " is even");
        } else {
            System.out.println(number + " is odd");
        }
    }
}
`,
  },
};
