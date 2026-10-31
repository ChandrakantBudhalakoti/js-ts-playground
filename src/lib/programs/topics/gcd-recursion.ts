import type { Program } from "../types";

export const program: Program = {
  slug: "gcd-recursion",
  level: "intermediate",
  topic: "Functions and recursion",
  name: "GCD using recursion",
  summary: "Finds the GCD (HCF) of two numbers with recursion",
  heading: "GCD (HCF) Using Recursion in {language}",
  description:
    "{language} program to find GCD (HCF) of two numbers using recursion and Euclid's algorithm, explained for beginners. Run it online in your browser.",
  explanation: [
    "The GCD (greatest common divisor) of two numbers, also called the HCF (highest common factor), is the largest number that divides both of them exactly. For 36 and 60 it is 12: 36 = 12 x 3 and 60 = 12 x 5.",
    "Euclid's algorithm finds it with one rule: the GCD of a and b is the same as the GCD of b and the remainder of a divided by b, and once b is 0 the answer is a. The function uses recursion, which means it calls itself with smaller numbers each time: gcd(36, 60) calls gcd(60, 36), then gcd(36, 24), then gcd(24, 12), then gcd(12, 0), which gives 12.",
  ],
  steps: [
    "The program reads two numbers.",
    "It calls the gcd function with them.",
    "Inside gcd, if b is 0 the answer is a, so the function returns it. This is the base case: the point where the recursion stops.",
    "Otherwise gcd calls itself with b and a % b (the remainder of a divided by b), and returns whatever that call returns.",
    "The program prints the answer.",
  ],
  notes: {
    python: [
      "def creates the function. It has to come before the line that calls it, because Python runs the file from top to bottom.",
      "% gives the remainder of a division: 60 % 36 is 24.",
    ],
    c: [
      "gcd is written above main, so the compiler already knows about it when main calls it.",
      "% gives the remainder of a division: 60 % 36 is 24.",
    ],
    cpp: [
      "gcd is written above main, so the compiler already knows about it when main calls it.",
      "% gives the remainder of a division: 60 % 36 is 24.",
    ],
    java: [
      "gcd is a static method, so main (which is also static) can call it directly, without creating an object first.",
      "% gives the remainder of a division: 60 % 36 is 24.",
    ],
  },
  stdin: "36 60\n",
  output: "Enter two numbers:\nGCD of 36 and 60 is 12",
  code: {
    python: String.raw`# Euclid's algorithm: gcd(a, b) is gcd(b, a % b), and gcd(a, 0) is a.
def gcd(a, b):
    if b == 0:
        return a  # base case: this stops the recursion
    return gcd(b, a % b)  # the function calls itself with smaller numbers


# Read the two numbers from one line.
print("Enter two numbers:")
parts = input().split()  # cut the line into pieces at the spaces
first = int(parts[0])
second = int(parts[1])

# Call the function and print its answer.
result = gcd(first, second)
print("GCD of", first, "and", second, "is", result)
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

// Euclid's algorithm: gcd(a, b) is gcd(b, a % b), and gcd(a, 0) is a.
int gcd(int a, int b) {
    if (b == 0) {
        return a;  // base case: this stops the recursion
    }
    return gcd(b, a % b);  // the function calls itself with smaller numbers
}

int main(void) {
    int first, second;

    // Read the two numbers.
    printf("Enter two numbers:\n");
    scanf("%d %d", &first, &second);

    // Call the function and print its answer.
    int result = gcd(first, second);
    printf("GCD of %d and %d is %d\n", first, second, result);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

// Euclid's algorithm: gcd(a, b) is gcd(b, a % b), and gcd(a, 0) is a.
int gcd(int a, int b) {
    if (b == 0) {
        return a;  // base case: this stops the recursion
    }
    return gcd(b, a % b);  // the function calls itself with smaller numbers
}

int main() {
    int first, second;

    // Read the two numbers.
    cout << "Enter two numbers:" << endl;
    cin >> first >> second;

    // Call the function and print its answer.
    int result = gcd(first, second);
    cout << "GCD of " << first << " and " << second << " is " << result << endl;
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets the program read input

public class Main {
    // Euclid's algorithm: gcd(a, b) is gcd(b, a % b), and gcd(a, 0) is a.
    static int gcd(int a, int b) {
        if (b == 0) {
            return a;  // base case: this stops the recursion
        }
        return gcd(b, a % b);  // the function calls itself with smaller numbers
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Read the two numbers.
        System.out.println("Enter two numbers:");
        int first = sc.nextInt();
        int second = sc.nextInt();

        // Call the function and print its answer.
        int result = gcd(first, second);
        System.out.println("GCD of " + first + " and " + second + " is " + result);
    }
}
`,
  },
};
