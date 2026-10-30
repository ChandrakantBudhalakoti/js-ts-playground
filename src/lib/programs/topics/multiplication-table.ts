import type { Program } from "../types";

export const program: Program = {
  slug: "multiplication-table",
  level: "beginner",
  topic: "Loops",
  name: "Multiplication table",
  summary: "Prints the multiplication table of a number",
  heading: "Multiplication Table Program in {language}",
  description:
    "Print the multiplication table of any number in {language} using a for loop, explained for beginners. Run the program online in your browser.",
  explanation: [
    "This program reads a number and prints its multiplication table, from 1 times up to 10 times, the same table you learned at school. Instead of writing ten print lines, it uses a loop: a block of code that runs again and again.",
    "A counter starts at 1 and goes up by 1 each time round the loop until it reaches 10. Each time, the program multiplies the number by the counter and prints one line. For 7, the counter 1 gives 7 x 1 = 7, the counter 2 gives 7 x 2 = 14, and so on up to 7 x 10 = 70.",
  ],
  steps: [
    "The program asks for a number and reads it.",
    "A for loop sets a counter, multiplier, to 1.",
    "Each time round, it prints the number, the multiplier and their product on one line.",
    "The multiplier goes up by 1, and the loop stops after 10.",
  ],
  notes: {
    python: [
      "range(1, 11) gives the numbers 1 to 10: it stops just before 11.",
    ],
    c: [
      "for (int multiplier = 1; multiplier <= 10; multiplier++) has three parts: where the counter starts, the condition to keep going, and multiplier++, which adds 1 after each time round.",
    ],
    cpp: [
      "for (int multiplier = 1; multiplier <= 10; multiplier++) has three parts: where the counter starts, the condition to keep going, and multiplier++, which adds 1 after each time round.",
    ],
    java: [
      "The brackets in (number * multiplier) make Java multiply first, before joining the answer to the text.",
    ],
  },
  stdin: "7\n",
  output:
    "Enter a number:\n7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70",
  code: {
    python: String.raw`# Ask for a number and read it.
print("Enter a number:")
number = int(input())

# multiplier takes the values 1, 2, 3, ..., 10 (range stops before 11).
for multiplier in range(1, 11):
    print(f"{number} x {multiplier} = {number * multiplier}")
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int number;

    // Ask for a number and read it.
    printf("Enter a number:\n");
    scanf("%d", &number);

    // multiplier goes 1, 2, 3, ..., 10: one line of the table each time.
    for (int multiplier = 1; multiplier <= 10; multiplier++) {
        printf("%d x %d = %d\n", number, multiplier, number * multiplier);
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int number;

    // Ask for a number and read it.
    cout << "Enter a number:" << endl;
    cin >> number;

    // multiplier goes 1, 2, 3, ..., 10: one line of the table each time.
    for (int multiplier = 1; multiplier <= 10; multiplier++) {
        cout << number << " x " << multiplier << " = " << number * multiplier << endl;
    }
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // gives us Scanner, which reads input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Ask for a number and read it.
        System.out.println("Enter a number:");
        int number = sc.nextInt();

        // multiplier goes 1, 2, 3, ..., 10: one line of the table each time.
        for (int multiplier = 1; multiplier <= 10; multiplier++) {
            System.out.println(number + " x " + multiplier + " = " + (number * multiplier));
        }
    }
}
`,
  },
};
