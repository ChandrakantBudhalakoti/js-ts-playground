import type { Program } from "../types";

export const program: Program = {
  slug: "prime-number",
  level: "beginner",
  topic: "Number programs",
  name: "Prime number",
  summary: "Checks whether a number is prime",
  heading: "Prime Number Program in {language}",
  description:
    "Check whether a number is prime in {language} using a loop, explained step by step for beginners. Run the program online in your browser.",
  explanation: [
    "A prime number is a whole number bigger than 1 that can only be divided exactly by 1 and by itself. 7 is prime, but 6 is not, because 6 = 2 × 3. The numbers 0 and 1 are not prime either. This program reads a number and tells you whether it is prime.",
    "To decide, the program tries dividing the number by 2, 3, 4 and so on. If any of these divisions leaves no remainder, the number is not prime. It only has to try divisors whose square is at most the number: for 29 that is 2, 3, 4 and 5, because 6 × 6 = 36 is already bigger than 29. Divisors come in pairs (36 = 4 × 9), and the smaller one of each pair is always in that range, so trying more would find nothing new.",
  ],
  steps: [
    "The program reads a number from the Input tab.",
    "If the number is less than 2, it is not prime.",
    "Otherwise the program starts by assuming the number is prime, then tries each divisor from 2 upwards while divisor × divisor is not bigger than the number.",
    "The remainder operator % checks each divisor. A remainder of 0 means the divisor goes in exactly, so the number is not prime and the loop stops early.",
    "Finally the program prints whether the number is prime or not.",
  ],
  notes: {
    python: [
      "% gives the remainder of a division: 29 % 2 is 1, and 28 % 2 is 0. A remainder of 0 means the division is exact.",
      "break leaves the loop straight away, because once one divisor is found there is no need to test more.",
    ],
    c: [
      "This program keeps the answer in an int called is_prime: 1 means yes and 0 means no. In C, if treats any value other than 0 as true.",
      "% gives the remainder of a division between two whole numbers: 29 % 2 is 1.",
    ],
    cpp: [
      "bool is a type that can hold only true or false, which suits a yes-or-no answer like isPrime.",
      "break leaves the for loop as soon as a divisor is found.",
    ],
    java: [
      "boolean is Java's true-or-false type. if (isPrime) runs its block when isPrime is true.",
      'String concatenation with + joins the number and the text into one line, for example 29 + " is a prime number".',
    ],
  },
  stdin: "29\n",
  output: "Enter a number:\n29 is a prime number",
  code: {
    python: String.raw`# Ask for a number and read it from the input.
print("Enter a number:")
number = int(input())

# Numbers below 2 (such as 0 and 1) are not prime.
if number < 2:
    is_prime = False
else:
    is_prime = True  # assume prime until we find a divisor
    divisor = 2
    # Only divisors up to the square root of the number need testing.
    while divisor * divisor <= number:
        if number % divisor == 0:  # % gives the remainder
            is_prime = False  # it divides exactly, so not prime
            break  # no need to test any more divisors
        divisor = divisor + 1

# Show the answer.
if is_prime:
    print(f"{number} is a prime number")
else:
    print(f"{number} is not a prime number")
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int number;
    int is_prime;  // 1 means prime, 0 means not prime

    // Ask for a number and read it from the input.
    printf("Enter a number:\n");
    scanf("%d", &number);  // & gives scanf the address of number

    if (number < 2) {
        is_prime = 0;  // numbers below 2 (such as 0 and 1) are not prime
    } else {
        is_prime = 1;  // assume prime until we find a divisor
        // Only divisors up to the square root of the number need testing.
        for (int divisor = 2; divisor * divisor <= number; divisor++) {
            if (number % divisor == 0) {  // % gives the remainder
                is_prime = 0;  // it divides exactly, so not prime
                break;  // no need to test any more divisors
            }
        }
    }

    // Show the answer.
    if (is_prime) {
        printf("%d is a prime number\n", number);
    } else {
        printf("%d is not a prime number\n", number);
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int number;
    bool isPrime;  // true or false

    // Ask for a number and read it from the input.
    cout << "Enter a number:" << endl;
    cin >> number;

    if (number < 2) {
        isPrime = false;  // numbers below 2 (such as 0 and 1) are not prime
    } else {
        isPrime = true;  // assume prime until we find a divisor
        // Only divisors up to the square root of the number need testing.
        for (int divisor = 2; divisor * divisor <= number; divisor++) {
            if (number % divisor == 0) {  // % gives the remainder
                isPrime = false;  // it divides exactly, so not prime
                break;  // no need to test any more divisors
            }
        }
    }

    // Show the answer.
    if (isPrime) {
        cout << number << " is a prime number" << endl;
    } else {
        cout << number << " is not a prime number" << endl;
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

        boolean isPrime;  // true or false
        if (number < 2) {
            isPrime = false;  // numbers below 2 (such as 0 and 1) are not prime
        } else {
            isPrime = true;  // assume prime until we find a divisor
            // Only divisors up to the square root of the number need testing.
            for (int divisor = 2; divisor * divisor <= number; divisor++) {
                if (number % divisor == 0) {  // % gives the remainder
                    isPrime = false;  // it divides exactly, so not prime
                    break;  // no need to test any more divisors
                }
            }
        }

        // Show the answer.
        if (isPrime) {
            System.out.println(number + " is a prime number");
        } else {
            System.out.println(number + " is not a prime number");
        }
    }
}
`,
  },
};
