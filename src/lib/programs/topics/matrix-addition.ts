import type { Program } from "../types";

export const program: Program = {
  slug: "matrix-addition",
  level: "intermediate",
  topic: "Arrays",
  name: "Matrix addition",
  summary: "Adds two matrices stored in 2D arrays",
  heading: "Matrix Addition Program in {language}",
  description:
    "Matrix addition program in {language} using 2D arrays: add two matrices and print the sum. Explained for beginners; run it online in your browser.",
  explanation: [
    "A matrix is a grid of numbers arranged in rows and columns. A program stores it in a two-dimensional (2D) array: an array of rows, where each row is itself an array of numbers. This program reads two matrices of the same size and prints their sum.",
    "Two matrices are added place by place: the number in row 1, column 1 of A is added to the number in row 1, column 1 of B, and so on for every place. In the sample, 1 + 7 = 8 and 2 + 8 = 10 give the first two numbers of the answer.",
  ],
  steps: [
    "The program reads the number of rows and columns.",
    "Two nested loops (one loop inside another) read matrix A, one row at a time; the same loops then read matrix B.",
    "Another pair of loops adds the numbers in the same place: sum[row][col] = A[row][col] + B[row][col].",
    "The last pair of loops prints the sum, one row per line, with a space between the numbers.",
  ],
  notes: {
    python: [
      "Python stores a matrix as a list of lists: matrix_a[1][2] is row 1, column 2 (both counted from 0), which is 6 in the sample.",
      "Type each row on its own line, because input() reads one line at a time.",
    ],
    c: [
      "int matrixA[10][10] has room for up to 10 rows and 10 columns. The first index is the row and the second the column, both counted from 0, so matrixA[0][0] is the top-left number.",
      "scanf skips spaces and new lines, so the numbers can be typed in any layout.",
    ],
    cpp: [
      "int matrixA[10][10] has room for up to 10 rows and 10 columns. The first index is the row and the second the column, both counted from 0, so matrixA[0][0] is the top-left number.",
      "if (col > 0) prints a space before every number except the first, so no line ends with a space.",
    ],
    java: [
      "new int[rows][columns] makes a 2D array of exactly that size. matrixA[1][2] is row 1, column 2, both counted from 0.",
      "sc.nextInt() skips spaces and new lines, so the numbers can be typed in any layout.",
    ],
  },
  stdin: "2 3\n1 2 3\n4 5 6\n7 8 9\n10 11 12\n",
  output:
    "Enter the number of rows and columns:\nEnter matrix A, row by row:\nEnter matrix B, row by row:\nSum of the two matrices:\n8 10 12\n14 16 18",
  code: {
    python: String.raw`# Read the size of the matrices, like 2 3.
print("Enter the number of rows and columns:")
parts = input().split()
rows = int(parts[0])
columns = int(parts[1])

# Read matrix A: each line of input is one row.
print("Enter matrix A, row by row:")
matrix_a = []
for row in range(rows):
    parts = input().split()
    numbers = []
    for col in range(columns):
        numbers.append(int(parts[col]))
    matrix_a.append(numbers)  # add the row to the matrix

# Read matrix B the same way.
print("Enter matrix B, row by row:")
matrix_b = []
for row in range(rows):
    parts = input().split()
    numbers = []
    for col in range(columns):
        numbers.append(int(parts[col]))
    matrix_b.append(numbers)

# Add the numbers that are in the same place in both matrices.
sum_matrix = []
for row in range(rows):
    sums = []
    for col in range(columns):
        sums.append(matrix_a[row][col] + matrix_b[row][col])
    sum_matrix.append(sums)

# Print the sum, one row per line.
print("Sum of the two matrices:")
for row in range(rows):
    line = ""
    for col in range(columns):
        if col > 0:
            line = line + " "  # a space between numbers, not before the first
        line = line + str(sum_matrix[row][col])
    print(line)
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    // Room for matrices of up to 10 rows and 10 columns.
    int matrixA[10][10], matrixB[10][10], sumMatrix[10][10];
    int rows, columns;

    // Read the size of the matrices, like 2 3.
    printf("Enter the number of rows and columns:\n");
    scanf("%d %d", &rows, &columns);

    // Read matrix A, one row at a time.
    printf("Enter matrix A, row by row:\n");
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < columns; col++) {
            scanf("%d", &matrixA[row][col]);
        }
    }

    // Read matrix B the same way.
    printf("Enter matrix B, row by row:\n");
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < columns; col++) {
            scanf("%d", &matrixB[row][col]);
        }
    }

    // Add the numbers that are in the same place in both matrices.
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < columns; col++) {
            sumMatrix[row][col] = matrixA[row][col] + matrixB[row][col];
        }
    }

    // Print the sum, one row per line.
    printf("Sum of the two matrices:\n");
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < columns; col++) {
            if (col > 0) {
                printf(" ");  // a space between numbers, not before the first
            }
            printf("%d", sumMatrix[row][col]);
        }
        printf("\n");  // end of the row
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    // Room for matrices of up to 10 rows and 10 columns.
    int matrixA[10][10], matrixB[10][10], sumMatrix[10][10];
    int rows, columns;

    // Read the size of the matrices, like 2 3.
    cout << "Enter the number of rows and columns:" << endl;
    cin >> rows >> columns;

    // Read matrix A, one row at a time.
    cout << "Enter matrix A, row by row:" << endl;
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < columns; col++) {
            cin >> matrixA[row][col];
        }
    }

    // Read matrix B the same way.
    cout << "Enter matrix B, row by row:" << endl;
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < columns; col++) {
            cin >> matrixB[row][col];
        }
    }

    // Add the numbers that are in the same place in both matrices.
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < columns; col++) {
            sumMatrix[row][col] = matrixA[row][col] + matrixB[row][col];
        }
    }

    // Print the sum, one row per line.
    cout << "Sum of the two matrices:" << endl;
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < columns; col++) {
            if (col > 0) {
                cout << " ";  // a space between numbers, not before the first
            }
            cout << sumMatrix[row][col];
        }
        cout << endl;  // end of the row
    }
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets the program read input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Read the size of the matrices, like 2 3.
        System.out.println("Enter the number of rows and columns:");
        int rows = sc.nextInt();
        int columns = sc.nextInt();

        // Make three 2D arrays of that size.
        int[][] matrixA = new int[rows][columns];
        int[][] matrixB = new int[rows][columns];
        int[][] sumMatrix = new int[rows][columns];

        // Read matrix A, one row at a time.
        System.out.println("Enter matrix A, row by row:");
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < columns; col++) {
                matrixA[row][col] = sc.nextInt();
            }
        }

        // Read matrix B the same way.
        System.out.println("Enter matrix B, row by row:");
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < columns; col++) {
                matrixB[row][col] = sc.nextInt();
            }
        }

        // Add the numbers that are in the same place in both matrices.
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < columns; col++) {
                sumMatrix[row][col] = matrixA[row][col] + matrixB[row][col];
            }
        }

        // Print the sum, one row per line.
        System.out.println("Sum of the two matrices:");
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < columns; col++) {
                // A space between numbers, but not before the first.
                if (col > 0) {
                    System.out.print(" ");
                }
                System.out.print(sumMatrix[row][col]);
            }
            System.out.println();  // end of the row
        }
    }
}
`,
  },
};
