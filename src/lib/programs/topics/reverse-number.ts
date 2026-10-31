import type { Program } from "../types";

export const program: Program = {
  slug: "reverse-number",
  level: "beginner",
  topic: "Number programs",
  name: "Reverse a number",
  summary: "Reverses the digits of a number",
  heading: "Reverse a Number in {language}",
  description:
    "Reverse the digits of a number in {language} with a while loop, % and /, explained for beginners. Run the program online in your browser.",
  explanation: [
    "This program turns a number around, so 12345 becomes 54321. It does it with arithmetic, one digit at a time, instead of treating the number as text. A number that ends in 0 loses that 0 when reversed: 120 becomes 21.",
    "Two facts make it work. The remainder after dividing by 10 is the last digit (12345 % 10 is 5), and whole-number division by 10 removes the last digit (12345 / 10 is 1234). The program takes the last digit off again and again, and adds each one to the end of the reversed number by first multiplying that by 10. The reversed number grows 0, 5, 54, 543, 5432 and finally 54321.",
  ],
  steps: [
    "The program reads a positive number from the Input tab, and makes a copy of it called remaining.",
    "The reversed number starts at 0.",
    "While remaining is bigger than 0, the program takes its last digit with % 10.",
    "It multiplies the reversed number by 10 and adds the digit, which puts the digit on the end.",
    "It removes the last digit from remaining with whole-number division by 10, and the loop repeats until no digits are left.",
    "Finally the program prints the original number and its reverse.",
  ],
  notes: {
    python: [
      "In Python, // is whole-number division: 12345 // 10 is 1234. A single / would give 1234.5, a decimal.",
      "reversed_number is used as the name because reversed is already the name of a built-in Python function.",
    ],
    c: [
      "When both numbers are ints, / throws away the remainder: 12345 / 10 is 1234, not 1234.5.",
      "% gives the remainder of a division: 12345 % 10 is 5, the last digit.",
    ],
    cpp: [
      "When both numbers are ints, / throws away the remainder: 12345 / 10 is 1234, not 1234.5.",
      "% gives the remainder of a division: 12345 % 10 is 5, the last digit.",
    ],
    java: [
      "When both numbers are ints, / throws away the remainder: 12345 / 10 is 1234, not 1234.5.",
      "% gives the remainder of a division: 12345 % 10 is 5, the last digit.",
    ],
  },
  stdin: "12345\n",
  output: "Enter a positive number:\nReverse of 12345 is 54321",
  code: {
    python: String.raw`# Ask for a positive number and read it from the input.
print("Enter a positive number:")
number = int(input())

remaining = number  # a copy we can take digits away from
reversed_number = 0

while remaining > 0:
    digit = remaining % 10  # the last digit: 12345 % 10 is 5
    reversed_number = reversed_number * 10 + digit  # put the digit on the end
    remaining = remaining // 10  # drop the last digit: 12345 // 10 is 1234

print(f"Reverse of {number} is {reversed_number}")
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int number;
    int reversed_number = 0;

    // Ask for a positive number and read it from the input.
    printf("Enter a positive number:\n");
    scanf("%d", &number);  // & gives scanf the address of number

    int remaining = number;  // a copy we can take digits away from

    while (remaining > 0) {
        int digit = remaining % 10;  // the last digit: 12345 % 10 is 5
        reversed_number = reversed_number * 10 + digit;  // put the digit on the end
        remaining = remaining / 10;  // drop the last digit: 12345 / 10 is 1234
    }

    printf("Reverse of %d is %d\n", number, reversed_number);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int number;
    int reversedNumber = 0;

    // Ask for a positive number and read it from the input.
    cout << "Enter a positive number:" << endl;
    cin >> number;

    int remaining = number;  // a copy we can take digits away from

    while (remaining > 0) {
        int digit = remaining % 10;  // the last digit: 12345 % 10 is 5
        reversedNumber = reversedNumber * 10 + digit;  // put the digit on the end
        remaining = remaining / 10;  // drop the last digit: 12345 / 10 is 1234
    }

    cout << "Reverse of " << number << " is " << reversedNumber << endl;
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets us read input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Ask for a positive number and read it.
        System.out.println("Enter a positive number:");
        int number = sc.nextInt();

        int remaining = number;  // a copy we can take digits away from
        int reversedNumber = 0;

        while (remaining > 0) {
            int digit = remaining % 10;  // the last digit: 12345 % 10 is 5
            reversedNumber = reversedNumber * 10 + digit;  // put the digit on the end
            remaining = remaining / 10;  // drop the last digit: 12345 / 10 is 1234
        }

        System.out.println("Reverse of " + number + " is " + reversedNumber);
    }
}
`,
  },
};
