import type { Program } from "../types";

export const program: Program = {
  slug: "floyds-triangle",
  level: "beginner",
  topic: "Patterns",
  name: "Floyd's triangle",
  summary: "Prints the numbers 1, 2, 3 ... as a triangle",
  heading: "Floyd's Triangle Program in {language}",
  description:
    "Floyd's triangle program in {language} using nested loops, explained line by line for beginners. Run the code online in your browser.",
  explanation: [
    "Floyd's triangle is a triangle of numbers. The first row has one number, the second row has two, the third row has three, and so on. The numbers just keep counting up from 1: the rows are 1, then 2 3, then 4 5 6, then 7 8 9 10.",
    "The program uses two loops, one inside the other (called nested loops). The outer loop goes through the rows, and the inner loop prints the numbers of one row: row 3 gets exactly 3 numbers. A separate counter remembers which number comes next, so the counting carries on from the end of one row to the start of the next.",
  ],
  steps: [
    "The program asks for the number of rows and reads it from the Input tab.",
    "A counter called number starts at 1.",
    "The outer loop runs once for each row, from row 1 up to the last row.",
    "The inner loop prints as many numbers as the row number, adding 1 to the counter after each one. A space goes between two numbers, but not before the first one.",
    "After each row, the program moves to a new line.",
  ],
  notes: {
    python: [
      'print(number, end="") prints without moving to a new line, so the numbers of one row stay together. The empty print() at the end of each row moves to the next line.',
      "range(1, rows + 1) counts from 1 up to rows: the end value itself is left out, which is why there is a + 1.",
    ],
    c: [
      'scanf("%d", &rows) reads a whole number from the input into rows. The & means "the address of": it tells scanf where in memory rows lives, so scanf can store the number there. Forgetting the & is one of the most common mistakes in C.',
      "%d stands for a whole number (an int), in both scanf and printf.",
    ],
    cpp: [
      "cin >> rows reads a number from the input into rows. Unlike C's scanf, no & is needed.",
      "cout << number prints the number and stays on the same line; cout << endl ends the row.",
    ],
    java: [
      "A Scanner reads input. sc.nextInt() reads the next whole number typed in the Input tab.",
      "System.out.print stays on the same line; System.out.println() moves to a new line.",
    ],
  },
  stdin: "5\n",
  output: "Enter the number of rows:\n1\n2 3\n4 5 6\n7 8 9 10\n11 12 13 14 15",
  code: {
    python: String.raw`# Ask for the number of rows and read it from the input.
print("Enter the number of rows:")
rows = int(input())  # input() reads text; int() turns it into a number

number = 1  # the next number to print

# The outer loop goes through the rows: 1, 2, 3, ...
for row in range(1, rows + 1):
    # Row 1 has 1 number, row 2 has 2 numbers, and so on.
    for column in range(1, row + 1):
        if column > 1:
            print(" ", end="")  # a space between numbers, not before the first
        print(number, end="")  # end="" stays on the same line
        number = number + 1  # move on to the next number
    print()  # end the row
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int rows;
    int number = 1;  // the next number to print

    // Ask for the number of rows and read it from the input.
    printf("Enter the number of rows:\n");
    scanf("%d", &rows);  // & gives scanf the address of rows

    // The outer loop goes through the rows: 1, 2, 3, ...
    for (int row = 1; row <= rows; row++) {
        // Row 1 has 1 number, row 2 has 2 numbers, and so on.
        for (int column = 1; column <= row; column++) {
            if (column > 1) {
                printf(" ");  // a space between numbers, not before the first
            }
            printf("%d", number);
            number++;  // move on to the next number
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
    int number = 1;  // the next number to print

    // Ask for the number of rows and read it from the input.
    cout << "Enter the number of rows:" << endl;
    cin >> rows;

    // The outer loop goes through the rows: 1, 2, 3, ...
    for (int row = 1; row <= rows; row++) {
        // Row 1 has 1 number, row 2 has 2 numbers, and so on.
        for (int column = 1; column <= row; column++) {
            if (column > 1) {
                cout << " ";  // a space between numbers, not before the first
            }
            cout << number;
            number++;  // move on to the next number
        }
        cout << endl;  // end the row
    }
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets us read input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Ask for the number of rows and read it.
        System.out.println("Enter the number of rows:");
        int rows = sc.nextInt();

        int number = 1;  // the next number to print

        // The outer loop goes through the rows: 1, 2, 3, ...
        for (int row = 1; row <= rows; row++) {
            // Row 1 has 1 number, row 2 has 2 numbers, and so on.
            for (int column = 1; column <= row; column++) {
                if (column > 1) {
                    System.out.print(" ");  // a space between numbers, not before the first
                }
                System.out.print(number);  // print stays on the same line
                number++;  // move on to the next number
            }
            System.out.println();  // end the row
        }
    }
}
`,
  },
};
