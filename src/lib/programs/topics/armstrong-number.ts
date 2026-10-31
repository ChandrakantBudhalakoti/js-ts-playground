import type { Program } from "../types";

export const program: Program = {
  slug: "armstrong-number",
  level: "beginner",
  topic: "Number programs",
  name: "Armstrong number",
  summary: "Checks whether a number is an Armstrong number",
  heading: "Armstrong Number Program in {language}",
  description:
    "Check whether a number is an Armstrong number in {language}, like 153, explained step by step for beginners. Run the program online in your browser.",
  explanation: [
    "An Armstrong number is equal to the sum of its own digits, each raised to the power of how many digits the number has. 153 has 3 digits, and 1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153, so 153 is an Armstrong number. 123 is not: 1^3 + 2^3 + 3^3 = 1 + 8 + 27 = 36. Other examples are 370, 371, 407 and the 4-digit 1634.",
    "Raising to a power means multiplying a number by itself that many times: 5^3 = 5 × 5 × 5 = 125. The program first counts the digits. Then it goes through the digits one by one, works out each power with a small loop, and adds it to a running total. At the end it compares the total with the original number.",
  ],
  steps: [
    "The program reads a number from the Input tab.",
    "It counts the digits by dividing a copy of the number by 10 until nothing is left (153 becomes 15, then 1, then 0: 3 digits).",
    "It goes through the digits again, taking the last one each time with % 10.",
    "For each digit, an inner loop multiplies 1 by the digit once for every digit in the number, which gives the power. The power is added to the total.",
    "Finally the program compares the total with the original number and prints whether it is an Armstrong number.",
  ],
  notes: {
    python: [
      "In Python, // is whole-number division: 153 // 10 is 15. A single / would give 15.3, a decimal.",
      "The variable is called total, not sum, because sum is already the name of a built-in Python function.",
    ],
    c: [
      "When both numbers are ints, / throws away the remainder: 153 / 10 is 15.",
      "C has a pow function, but it works with decimal numbers and needs math.h; a small loop of multiplications gives an exact whole-number answer.",
    ],
    cpp: [
      "When both numbers are ints, / throws away the remainder: 153 / 10 is 15.",
      "The power is worked out with a loop of multiplications, which always gives an exact whole-number answer.",
    ],
    java: [
      "When both numbers are ints, / throws away the remainder: 153 / 10 is 15.",
      "The power is worked out with a loop of multiplications instead of Math.pow, which works with decimal numbers.",
    ],
  },
  stdin: "153\n",
  output: "Enter a number:\n153 is an Armstrong number",
  code: {
    python: String.raw`# Ask for a number and read it from the input.
print("Enter a number:")
number = int(input())

# Step 1: count the digits.
digit_count = 0
remaining = number  # a copy we can take digits away from
while remaining > 0:
    digit_count = digit_count + 1
    remaining = remaining // 10  # drop the last digit

# Step 2: add up each digit raised to the power digit_count.
total = 0
remaining = number
while remaining > 0:
    digit = remaining % 10  # the last digit
    # Multiply digit by itself digit_count times to get the power.
    power = 1
    for count in range(digit_count):
        power = power * digit
    total = total + power
    remaining = remaining // 10  # drop the last digit

# Step 3: compare the total with the number.
if total == number:
    print(f"{number} is an Armstrong number")
else:
    print(f"{number} is not an Armstrong number")
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int number;
    int digit_count = 0;
    int total = 0;

    // Ask for a number and read it from the input.
    printf("Enter a number:\n");
    scanf("%d", &number);  // & gives scanf the address of number

    // Step 1: count the digits.
    int remaining = number;  // a copy we can take digits away from
    while (remaining > 0) {
        digit_count++;
        remaining = remaining / 10;  // drop the last digit
    }

    // Step 2: add up each digit raised to the power digit_count.
    remaining = number;
    while (remaining > 0) {
        int digit = remaining % 10;  // the last digit
        // Multiply digit by itself digit_count times to get the power.
        int power = 1;
        for (int count = 1; count <= digit_count; count++) {
            power = power * digit;
        }
        total = total + power;
        remaining = remaining / 10;  // drop the last digit
    }

    // Step 3: compare the total with the number.
    if (total == number) {
        printf("%d is an Armstrong number\n", number);
    } else {
        printf("%d is not an Armstrong number\n", number);
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int number;
    int digitCount = 0;
    int total = 0;

    // Ask for a number and read it from the input.
    cout << "Enter a number:" << endl;
    cin >> number;

    // Step 1: count the digits.
    int remaining = number;  // a copy we can take digits away from
    while (remaining > 0) {
        digitCount++;
        remaining = remaining / 10;  // drop the last digit
    }

    // Step 2: add up each digit raised to the power digitCount.
    remaining = number;
    while (remaining > 0) {
        int digit = remaining % 10;  // the last digit
        // Multiply digit by itself digitCount times to get the power.
        int power = 1;
        for (int count = 1; count <= digitCount; count++) {
            power = power * digit;
        }
        total = total + power;
        remaining = remaining / 10;  // drop the last digit
    }

    // Step 3: compare the total with the number.
    if (total == number) {
        cout << number << " is an Armstrong number" << endl;
    } else {
        cout << number << " is not an Armstrong number" << endl;
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

        // Step 1: count the digits.
        int digitCount = 0;
        int remaining = number;  // a copy we can take digits away from
        while (remaining > 0) {
            digitCount++;
            remaining = remaining / 10;  // drop the last digit
        }

        // Step 2: add up each digit raised to the power digitCount.
        int total = 0;
        remaining = number;
        while (remaining > 0) {
            int digit = remaining % 10;  // the last digit
            // Multiply digit by itself digitCount times to get the power.
            int power = 1;
            for (int count = 1; count <= digitCount; count++) {
                power = power * digit;
            }
            total = total + power;
            remaining = remaining / 10;  // drop the last digit
        }

        // Step 3: compare the total with the number.
        if (total == number) {
            System.out.println(number + " is an Armstrong number");
        } else {
            System.out.println(number + " is not an Armstrong number");
        }
    }
}
`,
  },
};
