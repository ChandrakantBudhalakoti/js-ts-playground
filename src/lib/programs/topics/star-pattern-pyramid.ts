import type { Program } from "../types";

export const program: Program = {
  slug: "star-pattern-pyramid",
  level: "beginner",
  topic: "Patterns",
  name: "Pyramid star pattern",
  summary: "Prints a centred pyramid of stars",
  heading: "Pyramid Star Pattern Program in {language}",
  description:
    "Print a pyramid star pattern in {language} using nested for loops, explained row by row for beginners. Run the program online in your browser.",
  explanation: [
    "This program reads a number of rows and prints a pyramid of stars: 1 star on the top row, then 3, then 5, and so on, each row centred under the one above. Pattern programs like this are a favourite in lab files and exams because they practise loops inside loops (nested loops).",
    "Each row is some spaces followed by some stars. Row number r has (rows - r) spaces and (2 x r - 1) stars. With 5 rows, row 1 has 4 spaces and 1 star, row 2 has 3 spaces and 3 stars, and row 5 has no spaces and 9 stars. The spaces shrink by one each row, which pushes the stars into a centred pyramid.",
  ],
  steps: [
    "The program asks for the number of rows and reads it.",
    "The outer loop runs once for each row, from 1 to rows.",
    "The first inner loop prints the spaces for that row: rows - row of them.",
    "The second inner loop prints the stars: twice the row number minus 1.",
    "After the stars, the program moves to a new line, ready for the next row.",
  ],
  notes: {
    python: [
      'print(" ", end="") prints without moving to a new line. print() on its own ends the line.',
      "range(1, rows + 1) gives 1 to rows, because range stops just before its second number.",
    ],
    c: [
      'printf(" ") and printf("*") stay on the same line; printf("\\n") ends the row.',
    ],
    cpp: [
      "cout without endl stays on the same line; cout << endl ends the row.",
    ],
    java: [
      "System.out.print stays on the same line; System.out.println() with nothing inside ends the row.",
    ],
  },
  stdin: "5\n",
  output:
    "Enter the number of rows:\n    *\n   ***\n  *****\n *******\n*********",
  code: {
    python: String.raw`# Ask for the number of rows and read it.
print("Enter the number of rows:")
rows = int(input())

# The outer loop prints one row each time: row is 1, 2, ..., rows.
for row in range(1, rows + 1):
    # Spaces first: one fewer on each row, to centre the stars.
    for space in range(rows - row):
        print(" ", end="")
    # Then the stars: 1, 3, 5, ... (2 * row - 1 of them).
    for star in range(2 * row - 1):
        print("*", end="")
    # End the row.
    print()
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int rows;

    // Ask for the number of rows and read it.
    printf("Enter the number of rows:\n");
    scanf("%d", &rows);

    // The outer loop prints one row each time: row is 1, 2, ..., rows.
    for (int row = 1; row <= rows; row++) {
        // Spaces first: one fewer on each row, to centre the stars.
        for (int space = 1; space <= rows - row; space++) {
            printf(" ");
        }
        // Then the stars: 1, 3, 5, ... (2 * row - 1 of them).
        for (int star = 1; star <= 2 * row - 1; star++) {
            printf("*");
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

    // The outer loop prints one row each time: row is 1, 2, ..., rows.
    for (int row = 1; row <= rows; row++) {
        // Spaces first: one fewer on each row, to centre the stars.
        for (int space = 1; space <= rows - row; space++) {
            cout << " ";
        }
        // Then the stars: 1, 3, 5, ... (2 * row - 1 of them).
        for (int star = 1; star <= 2 * row - 1; star++) {
            cout << "*";
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

        // The outer loop prints one row each time: row is 1, 2, ..., rows.
        for (int row = 1; row <= rows; row++) {
            // Spaces first: one fewer on each row, to centre the stars.
            for (int space = 1; space <= rows - row; space++) {
                System.out.print(" ");
            }
            // Then the stars: 1, 3, 5, ... (2 * row - 1 of them).
            for (int star = 1; star <= 2 * row - 1; star++) {
                System.out.print("*");
            }
            System.out.println();  // end the row
        }
    }
}
`,
  },
};
