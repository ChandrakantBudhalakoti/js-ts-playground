import type { Program } from "../types";

export const program: Program = {
  slug: "fibonacci-series",
  level: "beginner",
  topic: "Number programs",
  name: "Fibonacci series",
  summary: "Prints the Fibonacci series 0 1 1 2 3 5 ...",
  heading: "Fibonacci Series Program in {language}",
  description:
    "Print the Fibonacci series in {language} using a loop, explained step by step for beginners. Run the Fibonacci program online in your browser.",
  explanation: [
    "The Fibonacci series starts with 0 and 1, and every number after that is the sum of the two numbers before it: 0 + 1 = 1, 1 + 1 = 2, 1 + 2 = 3, 2 + 3 = 5, and so on. Each number in the series is called a term, and the first 10 terms are 0 1 1 2 3 5 8 13 21 34. This program reads how many terms you want and prints them on one line.",
    "The program only needs to remember two terms at a time: the current one and the one after it. Each time round the loop it prints the current term, then moves both one step along the series. For example, if they are 2 and 3, it prints 2, and then they become 3 and 2 + 3 = 5.",
  ],
  steps: [
    "The program reads the number of terms from the Input tab.",
    "Two variables hold the first two terms, 0 and 1.",
    "A loop runs once for each term and prints the current term, with a space before every term except the first.",
    "The next term is the sum of the two variables. The second term moves into the first variable, and the new term into the second.",
    "After the loop, the program ends the line.",
  ],
  notes: {
    python: [
      'print(first, end="") prints without moving to a new line, so all the terms appear on one line.',
      "The names first and second are just labels: after each step they move along to the next two terms of the series.",
    ],
    c: [
      "The terms are long long, a type for very big whole numbers. They grow fast, and from the 48th term on they are too big for an int.",
      "%lld is how printf prints a long long; %d is for an int.",
    ],
    cpp: [
      "The terms are long long, a type for very big whole numbers. They grow fast, and from the 48th term on they are too big for an int.",
      "cout << first prints the term and stays on the same line; cout << endl ends the line.",
    ],
    java: [
      "The terms are long, a type for very big whole numbers. They grow fast, and from the 48th term on they are too big for an int.",
      "System.out.print stays on the same line; System.out.println() ends it.",
    ],
  },
  stdin: "10\n",
  output: "Enter the number of terms:\n0 1 1 2 3 5 8 13 21 34",
  code: {
    python: String.raw`# Ask how many terms to print and read it from the input.
print("Enter the number of terms:")
terms = int(input())

first = 0  # the current term
second = 1  # the term after it

for count in range(1, terms + 1):
    if count > 1:
        print(" ", end="")  # a space between terms, not before the first
    print(first, end="")  # end="" stays on the same line
    # Move one step along the series.
    next_term = first + second  # each term is the sum of the two before it
    first = second
    second = next_term

print()  # end the line
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int terms;
    long long first = 0;  // the current term
    long long second = 1;  // the term after it
    long long next_term;

    // Ask how many terms to print and read it from the input.
    printf("Enter the number of terms:\n");
    scanf("%d", &terms);  // & gives scanf the address of terms

    for (int count = 1; count <= terms; count++) {
        if (count > 1) {
            printf(" ");  // a space between terms, not before the first
        }
        printf("%lld", first);  // %lld prints a long long
        // Move one step along the series.
        next_term = first + second;  // each term is the sum of the two before it
        first = second;
        second = next_term;
    }

    printf("\n");  // end the line
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int terms;
    long long first = 0;  // the current term
    long long second = 1;  // the term after it
    long long nextTerm;

    // Ask how many terms to print and read it from the input.
    cout << "Enter the number of terms:" << endl;
    cin >> terms;

    for (int count = 1; count <= terms; count++) {
        if (count > 1) {
            cout << " ";  // a space between terms, not before the first
        }
        cout << first;
        // Move one step along the series.
        nextTerm = first + second;  // each term is the sum of the two before it
        first = second;
        second = nextTerm;
    }

    cout << endl;  // end the line
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets us read input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Ask how many terms to print and read it.
        System.out.println("Enter the number of terms:");
        int terms = sc.nextInt();

        long first = 0;  // the current term
        long second = 1;  // the term after it

        for (int count = 1; count <= terms; count++) {
            if (count > 1) {
                System.out.print(" ");  // a space between terms, not before the first
            }
            System.out.print(first);  // print stays on the same line
            // Move one step along the series.
            long nextTerm = first + second;  // each term is the sum of the two before it
            first = second;
            second = nextTerm;
        }

        System.out.println();  // end the line
    }
}
`,
  },
};
