import type { Program } from "../types";

export const program: Program = {
  slug: "bubble-sort",
  level: "intermediate",
  topic: "Arrays",
  name: "Bubble sort",
  summary: "Sorts an array from smallest to largest",
  heading: "Bubble Sort Program in {language}",
  description:
    "Bubble sort program in {language} to sort an array in ascending order, explained step by step for beginners. Run it online in your browser.",
  explanation: [
    "Sorting means putting values in order, here from smallest to largest (ascending order). Bubble sort is one of the first sorting methods students learn: it walks along the array comparing each pair of neighbours, and swaps them when they are in the wrong order.",
    'One pass over 29, 10, 14, 37, 13, 5 swaps 29 and 10, then 29 and 14, leaves 29 and 37 alone, then swaps 37 and 13, and 37 and 5. The array becomes 10, 14, 29, 13, 5, 37: the largest number has "bubbled up" to the end. Each pass puts the next largest number in its place, so after n - 1 passes the whole array is sorted.',
  ],
  steps: [
    "The program reads the numbers into an array and prints them before sorting.",
    "The outer loop makes n - 1 passes over the array.",
    "The inner loop compares each element with the next one. If the left one is bigger, the two are swapped using a spare variable, temp.",
    "Each pass leaves the largest remaining number at the end, so the inner loop stops one place earlier every time.",
    "Finally the program prints the sorted array.",
  ],
  notes: {
    python: [
      "Python can swap two values in one line: numbers[j], numbers[j + 1] = numbers[j + 1], numbers[j]. The temp version is shown because it works the same way in every language.",
      "Python's sort() would do all this in one line, but lab exams usually ask you to write the sort yourself.",
    ],
    c: [
      "The swap needs a spare variable (temp): writing numbers[j] = numbers[j + 1] first would lose the old value of numbers[j].",
      'printf(" %d", ...) prints a space before each number, so no line ends with a space left over.',
    ],
    cpp: [
      "The swap needs a spare variable (temp): writing numbers[j] = numbers[j + 1] first would lose the old value of numbers[j].",
      "C++ has a ready-made sort, but lab exams usually ask you to write the sort yourself.",
    ],
    java: [
      "The swap needs a spare variable (temp): writing numbers[j] = numbers[j + 1] first would lose the old value of numbers[j].",
      "System.out.print does not move to a new line, so the numbers stay on one line; System.out.println() after the loop ends it.",
    ],
  },
  stdin: "6\n29 10 14 37 13 5\n",
  output:
    "Enter how many numbers:\nEnter 6 numbers:\nBefore sorting: 29 10 14 37 13 5\nAfter sorting: 5 10 13 14 29 37",
  code: {
    python: String.raw`# Read the numbers into a list.
print("Enter how many numbers:")
count = int(input())
print(f"Enter {count} numbers:")
parts = input().split()  # cut the line into pieces at the spaces
numbers = []
for i in range(count):
    numbers.append(int(parts[i]))

# Show the numbers before sorting, with a space before each one.
line = "Before sorting:"
for number in numbers:
    line = line + " " + str(number)
print(line)

# Bubble sort: make count - 1 passes over the list.
for i in range(count - 1):
    # Compare neighbours; the last i numbers are already in place.
    for j in range(count - 1 - i):
        if numbers[j] > numbers[j + 1]:
            # Wrong order: swap them, using temp to keep one value safe.
            temp = numbers[j]
            numbers[j] = numbers[j + 1]
            numbers[j + 1] = temp

# Show the sorted numbers.
line = "After sorting:"
for number in numbers:
    line = line + " " + str(number)
print(line)
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int numbers[100];  // room for up to 100 numbers
    int count;

    // Read the numbers into the array.
    printf("Enter how many numbers:\n");
    scanf("%d", &count);
    printf("Enter %d numbers:\n", count);
    for (int i = 0; i < count; i++) {
        scanf("%d", &numbers[i]);
    }

    // Show the numbers before sorting, with a space before each one.
    printf("Before sorting:");
    for (int i = 0; i < count; i++) {
        printf(" %d", numbers[i]);
    }
    printf("\n");

    // Bubble sort: make count - 1 passes over the array.
    for (int i = 0; i < count - 1; i++) {
        // Compare neighbours; the last i numbers are already in place.
        for (int j = 0; j < count - 1 - i; j++) {
            if (numbers[j] > numbers[j + 1]) {
                // Wrong order: swap them, using temp to keep one value safe.
                int temp = numbers[j];
                numbers[j] = numbers[j + 1];
                numbers[j + 1] = temp;
            }
        }
    }

    // Show the sorted numbers.
    printf("After sorting:");
    for (int i = 0; i < count; i++) {
        printf(" %d", numbers[i]);
    }
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int numbers[100];  // room for up to 100 numbers
    int count;

    // Read the numbers into the array.
    cout << "Enter how many numbers:" << endl;
    cin >> count;
    cout << "Enter " << count << " numbers:" << endl;
    for (int i = 0; i < count; i++) {
        cin >> numbers[i];
    }

    // Show the numbers before sorting, with a space before each one.
    cout << "Before sorting:";
    for (int i = 0; i < count; i++) {
        cout << " " << numbers[i];
    }
    cout << endl;

    // Bubble sort: make count - 1 passes over the array.
    for (int i = 0; i < count - 1; i++) {
        // Compare neighbours; the last i numbers are already in place.
        for (int j = 0; j < count - 1 - i; j++) {
            if (numbers[j] > numbers[j + 1]) {
                // Wrong order: swap them, using temp to keep one value safe.
                int temp = numbers[j];
                numbers[j] = numbers[j + 1];
                numbers[j + 1] = temp;
            }
        }
    }

    // Show the sorted numbers.
    cout << "After sorting:";
    for (int i = 0; i < count; i++) {
        cout << " " << numbers[i];
    }
    cout << endl;
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets the program read input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Read the numbers into the array.
        System.out.println("Enter how many numbers:");
        int count = sc.nextInt();
        int[] numbers = new int[count];
        System.out.println("Enter " + count + " numbers:");
        for (int i = 0; i < count; i++) {
            numbers[i] = sc.nextInt();
        }

        // Show the numbers before sorting, with a space before each one.
        System.out.print("Before sorting:");
        for (int i = 0; i < count; i++) {
            System.out.print(" " + numbers[i]);
        }
        System.out.println();

        // Bubble sort: make count - 1 passes over the array.
        for (int i = 0; i < count - 1; i++) {
            // Compare neighbours; the last i numbers are already in place.
            for (int j = 0; j < count - 1 - i; j++) {
                if (numbers[j] > numbers[j + 1]) {
                    // Wrong order: swap them, using temp to keep one value safe.
                    int temp = numbers[j];
                    numbers[j] = numbers[j + 1];
                    numbers[j + 1] = temp;
                }
            }
        }

        // Show the sorted numbers.
        System.out.print("After sorting:");
        for (int i = 0; i < count; i++) {
            System.out.print(" " + numbers[i]);
        }
        System.out.println();
    }
}
`,
  },
};
