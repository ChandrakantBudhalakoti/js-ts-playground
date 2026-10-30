import type { Program } from "../types";

export const program: Program = {
  slug: "factorial",
  level: "beginner",
  topic: "Number programs",
  name: "Factorial",
  summary: "Finds the factorial of a number with a loop",
  heading: "Factorial Program in {language}",
  description:
    "Find the factorial of a number in {language} using a loop, explained step by step for beginners. Run the factorial program online in your browser.",
  explanation: [
    "The factorial of a whole number is what you get by multiplying all the whole numbers from 1 up to it. It is written with an exclamation mark: 5! = 1 × 2 × 3 × 4 × 5 = 120. By definition 0! is 1. Factorials count arrangements: 5 friends can stand in a line in 120 different orders.",
    "The program keeps a running answer that starts at 1, because multiplying by 1 changes nothing. A loop then multiplies the answer by 1, then 2, then 3, and so on up to the number. For 4 the answer goes 1, 2, 6, 24. Factorials grow very fast (10! is already 3628800), so the answer is kept in a type that can hold very big whole numbers.",
  ],
  steps: [
    "The program reads a number from the Input tab.",
    "Factorials of negative numbers do not exist, so for a negative number the program prints a message instead.",
    "Otherwise the answer starts at 1.",
    "A loop counts from 1 up to the number and multiplies the answer by each count.",
    "Finally the program prints the answer.",
  ],
  notes: {
    python: [
      "Python's whole numbers have no size limit, so this program can work out even 100! exactly.",
      "range(1, number + 1) counts from 1 up to number: the end value is left out, which is why there is a + 1.",
    ],
    c: [
      "long long holds much bigger whole numbers than int. An int only goes up to about 2 billion, and 13! is already bigger than that. Even long long runs out after 20!.",
      "%lld is how printf prints a long long; %d is for an int.",
    ],
    cpp: [
      "long long holds much bigger whole numbers than int. An int only goes up to about 2 billion, and 13! is already bigger than that.",
      "cout prints a long long just like an int, with no special code.",
    ],
    java: [
      "long holds much bigger whole numbers than int: up to about 9 × 10^18, enough for factorials up to 20!.",
      "sc.nextInt() reads the next whole number typed in the Input tab.",
    ],
  },
  stdin: "10\n",
  output: "Enter a number:\nFactorial of 10 is 3628800",
  code: {
    python: String.raw`# Ask for a number and read it from the input.
print("Enter a number:")
number = int(input())

if number < 0:
    print("Factorial is not defined for negative numbers")
else:
    factorial = 1  # start at 1: multiplying by 1 changes nothing
    # Multiply by 1, 2, 3, ... up to the number.
    for counter in range(1, number + 1):
        factorial = factorial * counter
    print(f"Factorial of {number} is {factorial}")
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int number;
    long long factorial = 1;  // long long holds much bigger numbers than int

    // Ask for a number and read it from the input.
    printf("Enter a number:\n");
    scanf("%d", &number);  // & gives scanf the address of number

    if (number < 0) {
        printf("Factorial is not defined for negative numbers\n");
    } else {
        // Multiply by 1, 2, 3, ... up to the number.
        for (int counter = 1; counter <= number; counter++) {
            factorial = factorial * counter;
        }
        printf("Factorial of %d is %lld\n", number, factorial);  // %lld prints a long long
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int number;
    long long factorial = 1;  // long long holds much bigger numbers than int

    // Ask for a number and read it from the input.
    cout << "Enter a number:" << endl;
    cin >> number;

    if (number < 0) {
        cout << "Factorial is not defined for negative numbers" << endl;
    } else {
        // Multiply by 1, 2, 3, ... up to the number.
        for (int counter = 1; counter <= number; counter++) {
            factorial = factorial * counter;
        }
        cout << "Factorial of " << number << " is " << factorial << endl;
    }
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets us read input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Ask for a number and read it.
        System.out.println("Enter a number:");
        int number = sc.nextInt();

        if (number < 0) {
            System.out.println("Factorial is not defined for negative numbers");
        } else {
            long factorial = 1;  // long holds much bigger numbers than int
            // Multiply by 1, 2, 3, ... up to the number.
            for (int counter = 1; counter <= number; counter++) {
                factorial = factorial * counter;
            }
            System.out.println("Factorial of " + number + " is " + factorial);
        }
    }
}
`,
  },
};
