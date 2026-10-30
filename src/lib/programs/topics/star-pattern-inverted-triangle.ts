import type { Program } from "../types";

export const program: Program = {
  slug: "star-pattern-inverted-triangle",
  level: "beginner",
  topic: "Patterns",
  name: "Inverted triangle star pattern",
  summary: "Prints a triangle of stars that shrinks row by row",
  heading: "Inverted Triangle Star Pattern in {language}",
  description:
    "Print an inverted triangle star pattern in {language} using nested for loops, explained for beginners. Run the program online in your browser.",
  explanation: [
    "This program reads a number of rows and prints an upside-down triangle of stars. The first row has as many stars as there are rows, and each row below has one star fewer, down to a single star at the bottom.",
    "The trick is a loop that counts down instead of up. With 5 rows, the row counter goes 5, 4, 3, 2, 1, and each row prints that many stars. A space goes between stars but not after the last one, so row 5 prints * * * * * and row 1 prints a single *.",
  ],
  steps: [
    "The program asks for the number of rows and reads it.",
    "The outer loop counts down from rows to 1; the count is how many stars that row gets.",
    "The inner loop prints the stars one by one.",
    "After every star except the last, it prints a space, so stars are separated and nothing is left at the end of the line.",
    "After the stars, the program moves to a new line for the next row.",
  ],
  notes: {
    python: [
      "range(rows, 0, -1) counts down: 5, 4, 3, 2, 1. The -1 is the step, and the count stops just before 0.",
      'print("*", end="") prints without moving to a new line. print() on its own ends the line.',
    ],
    c: [
      "row-- takes 1 away from row after each time round, so the loop counts down.",
    ],
    cpp: [
      "row-- takes 1 away from row after each time round, so the loop counts down.",
    ],
    java: [
      "row-- takes 1 away from row after each time round, so the loop counts down. System.out.print stays on the same line; System.out.println() ends it.",
    ],
  },
  stdin: "5\n",
  output: "Enter the number of rows:\n* * * * *\n* * * *\n* * *\n* *\n*",
  code: {
    python: String.raw`# Ask for the number of rows and read it.
print("Enter the number of rows:")
rows = int(input())

# Count down: row is rows, rows - 1, ..., 1. Each row gets row stars.
for row in range(rows, 0, -1):
    for star in range(1, row + 1):
        print("*", end="")
        # A space between stars, but not after the last one.
        if star < row:
            print(" ", end="")
    # End the row.
    print()
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int rows;

    // Ask for the number of rows and read it.
    printf("Enter the number of rows:\n");
    scanf("%d", &rows);

    // Count down: row is rows, rows - 1, ..., 1. Each row gets row stars.
    for (int row = rows; row >= 1; row--) {
        for (int star = 1; star <= row; star++) {
            printf("*");
            // A space between stars, but not after the last one.
            if (star < row) {
                printf(" ");
            }
        }
        printf("\n");  // end the row
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int rows;

    // Ask for the number of rows and read it.
    cout << "Enter the number of rows:" << endl;
    cin >> rows;

    // Count down: row is rows, rows - 1, ..., 1. Each row gets row stars.
    for (int row = rows; row >= 1; row--) {
        for (int star = 1; star <= row; star++) {
            cout << "*";
            // A space between stars, but not after the last one.
            if (star < row) {
                cout << " ";
            }
        }
        cout << endl;  // end the row
    }
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // gives us Scanner, which reads input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Ask for the number of rows and read it.
        System.out.println("Enter the number of rows:");
        int rows = sc.nextInt();

        // Count down: row is rows, rows - 1, ..., 1. Each row gets row stars.
        for (int row = rows; row >= 1; row--) {
            for (int star = 1; star <= row; star++) {
                System.out.print("*");
                // A space between stars, but not after the last one.
                if (star < row) {
                    System.out.print(" ");
                }
            }
            System.out.println();  // end the row
        }
    }
}
`,
  },
};
