import type { Program } from "../types";

export const program: Program = {
  slug: "palindrome-number",
  level: "beginner",
  topic: "Number programs",
  name: "Palindrome number",
  summary: "Checks whether a number reads the same backwards",
  heading: "Palindrome Number Program in {language}",
  description:
    "Check whether a number is a palindrome in {language} by reversing its digits, explained for beginners. Run the program online in your browser.",
  explanation: [
    'A palindrome is something that reads the same forwards and backwards, like the word "madam". A palindrome number works the same way: 12321 and 7447 are palindromes, but 123 is not, because backwards it reads 321.',
    "So the program reverses the number and compares the reverse with the original. If they are equal, the number is a palindrome. To reverse it, the program takes the last digit with % 10 (12321 % 10 is 1), removes it with whole-number division by 10 (12321 / 10 is 1232), and puts each digit on the end of the reversed number by multiplying that by 10 and adding the digit.",
  ],
  steps: [
    "The program reads a number from the Input tab, and makes a copy of it called remaining.",
    "The reversed number starts at 0.",
    "While remaining is bigger than 0, the program takes its last digit with % 10, puts it on the end of the reversed number (multiply by 10, then add the digit) and removes it from remaining with whole-number division by 10.",
    "When no digits are left, the program compares the reversed number with the original number.",
    "If they are equal, it prints that the number is a palindrome; otherwise that it is not.",
  ],
  notes: {
    python: [
      "In Python, // is whole-number division: 12321 // 10 is 1232. A single / would give 1232.1, a decimal.",
      "== compares two values, while a single = stores a value in a variable.",
    ],
    c: [
      "When both numbers are ints, / throws away the remainder: 12321 / 10 is 1232.",
      "== compares two values, while a single = stores a value in a variable. Writing = by mistake inside an if is a classic bug.",
    ],
    cpp: [
      "When both numbers are ints, / throws away the remainder: 12321 / 10 is 1232.",
      "== compares two values, while a single = stores a value in a variable.",
    ],
    java: [
      "When both numbers are ints, / throws away the remainder: 12321 / 10 is 1232.",
      "== works for comparing numbers like these. (Strings are different: they are compared with equals.)",
    ],
  },
  stdin: "12321\n",
  output: "Enter a number:\n12321 is a palindrome",
  code: {
    python: String.raw`# Ask for a number and read it from the input.
print("Enter a number:")
number = int(input())

remaining = number  # a copy we can take digits away from
reversed_number = 0

# Reverse the number one digit at a time.
while remaining > 0:
    digit = remaining % 10  # the last digit
    reversed_number = reversed_number * 10 + digit  # put the digit on the end
    remaining = remaining // 10  # drop the last digit

# A palindrome is the same as its reverse.
if reversed_number == number:
    print(f"{number} is a palindrome")
else:
    print(f"{number} is not a palindrome")
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int number;
    int reversed_number = 0;

    // Ask for a number and read it from the input.
    printf("Enter a number:\n");
    scanf("%d", &number);  // & gives scanf the address of number

    int remaining = number;  // a copy we can take digits away from

    // Reverse the number one digit at a time.
    while (remaining > 0) {
        int digit = remaining % 10;  // the last digit
        reversed_number = reversed_number * 10 + digit;  // put the digit on the end
        remaining = remaining / 10;  // drop the last digit
    }

    // A palindrome is the same as its reverse.
    if (reversed_number == number) {
        printf("%d is a palindrome\n", number);
    } else {
        printf("%d is not a palindrome\n", number);
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int number;
    int reversedNumber = 0;

    // Ask for a number and read it from the input.
    cout << "Enter a number:" << endl;
    cin >> number;

    int remaining = number;  // a copy we can take digits away from

    // Reverse the number one digit at a time.
    while (remaining > 0) {
        int digit = remaining % 10;  // the last digit
        reversedNumber = reversedNumber * 10 + digit;  // put the digit on the end
        remaining = remaining / 10;  // drop the last digit
    }

    // A palindrome is the same as its reverse.
    if (reversedNumber == number) {
        cout << number << " is a palindrome" << endl;
    } else {
        cout << number << " is not a palindrome" << endl;
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

        int remaining = number;  // a copy we can take digits away from
        int reversedNumber = 0;

        // Reverse the number one digit at a time.
        while (remaining > 0) {
            int digit = remaining % 10;  // the last digit
            reversedNumber = reversedNumber * 10 + digit;  // put the digit on the end
            remaining = remaining / 10;  // drop the last digit
        }

        // A palindrome is the same as its reverse.
        if (reversedNumber == number) {
            System.out.println(number + " is a palindrome");
        } else {
            System.out.println(number + " is not a palindrome");
        }
    }
}
`,
  },
};
