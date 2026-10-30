import type { Program } from "../types";

export const program: Program = {
  slug: "array-sum-max",
  level: "beginner",
  topic: "Arrays",
  name: "Sum and largest of an array",
  summary: "Adds up an array and finds its largest element",
  heading: "Sum and Largest Element of an Array in {language}",
  description:
    "{language} program to find the sum and largest element of an array, explained line by line for beginners. Run it online in your browser.",
  explanation: [
    "An array is a row of boxes under one name, each holding one value. This program reads some numbers into an array, adds them all up and finds the biggest one.",
    "The idea is to visit the boxes one by one. A running total starts at 0 and every number is added to it. For the largest, the program first guesses the first number, and changes its guess whenever it meets a bigger one: for 12, 7, 25, 3 and 18 the guess starts at 12, becomes 25, and stays 25.",
  ],
  steps: [
    "The program reads how many numbers there are, then reads that many numbers into the array.",
    "total starts at 0, and largest starts as the first number in the array.",
    "A loop visits every element: it adds the element to total, and if the element is bigger than largest, it becomes the new largest.",
    "After the loop, the program prints the sum and the largest element.",
  ],
  notes: {
    python: [
      "Python uses a list instead of an array. append() adds a number to the end of the list.",
      "input().split() cuts the line into pieces at the spaces, and int() turns each piece into a number.",
    ],
    c: [
      'scanf needs to know where to store the number it reads, so you give it the address of a variable with &: &count means "the address of count", and &numbers[i] is the address of box i.',
      "int numbers[100] makes room for up to 100 numbers. The boxes are numbered from 0, so the first is numbers[0] and the last one used is numbers[count - 1].",
    ],
    cpp: [
      "int numbers[100] makes room for up to 100 numbers. The boxes are numbered from 0, so the first is numbers[0] and the last one used is numbers[count - 1].",
      "cin >> skips spaces and new lines, so the numbers can be typed on one line or on separate lines.",
    ],
    java: [
      "new int[count] makes an array with exactly count boxes, numbered from 0 to count - 1.",
      "sc.nextInt() reads the next number wherever it is, on the same line or the next one.",
    ],
  },
  stdin: "5\n12 7 25 3 18\n",
  output: "Enter how many numbers:\nEnter 5 numbers:\nSum = 65\nLargest = 25",
  code: {
    python: String.raw`# Read how many numbers there are.
print("Enter how many numbers:")
count = int(input())

# Read the numbers from one line into a list.
print(f"Enter {count} numbers:")
parts = input().split()  # cut the line into pieces at the spaces
numbers = []
for i in range(count):
    numbers.append(int(parts[i]))  # turn each piece into a number

# Add up the numbers and keep the largest one seen so far.
total = 0
largest = numbers[0]  # start by guessing the first number
for number in numbers:
    total = total + number
    if number > largest:
        largest = number  # found a bigger one

print("Sum =", total)
print("Largest =", largest)
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int numbers[100];  // room for up to 100 numbers
    int count;

    // Read how many numbers there are.
    printf("Enter how many numbers:\n");
    scanf("%d", &count);  // & gives scanf the address of count

    // Read each number into the next box of the array.
    printf("Enter %d numbers:\n", count);
    for (int i = 0; i < count; i++) {
        scanf("%d", &numbers[i]);
    }

    // Add up the numbers and keep the largest one seen so far.
    int total = 0;
    int largest = numbers[0];  // start by guessing the first number
    for (int i = 0; i < count; i++) {
        total = total + numbers[i];
        if (numbers[i] > largest) {
            largest = numbers[i];  // found a bigger one
        }
    }

    printf("Sum = %d\n", total);
    printf("Largest = %d\n", largest);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int numbers[100];  // room for up to 100 numbers
    int count;

    // Read how many numbers there are.
    cout << "Enter how many numbers:" << endl;
    cin >> count;

    // Read each number into the next box of the array.
    cout << "Enter " << count << " numbers:" << endl;
    for (int i = 0; i < count; i++) {
        cin >> numbers[i];
    }

    // Add up the numbers and keep the largest one seen so far.
    int total = 0;
    int largest = numbers[0];  // start by guessing the first number
    for (int i = 0; i < count; i++) {
        total = total + numbers[i];
        if (numbers[i] > largest) {
            largest = numbers[i];  // found a bigger one
        }
    }

    cout << "Sum = " << total << endl;
    cout << "Largest = " << largest << endl;
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets the program read input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Read how many numbers there are.
        System.out.println("Enter how many numbers:");
        int count = sc.nextInt();

        // Make an array with exactly count boxes, then fill it.
        int[] numbers = new int[count];
        System.out.println("Enter " + count + " numbers:");
        for (int i = 0; i < count; i++) {
            numbers[i] = sc.nextInt();
        }

        // Add up the numbers and keep the largest one seen so far.
        int total = 0;
        int largest = numbers[0];  // start by guessing the first number
        for (int i = 0; i < count; i++) {
            total = total + numbers[i];
            if (numbers[i] > largest) {
                largest = numbers[i];  // found a bigger one
            }
        }

        System.out.println("Sum = " + total);
        System.out.println("Largest = " + largest);
    }
}
`,
  },
};
