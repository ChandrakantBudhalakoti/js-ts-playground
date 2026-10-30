import type { Program } from "../types";

export const program: Program = {
  slug: "largest-of-three",
  level: "beginner",
  topic: "Decisions",
  name: "Largest of three numbers",
  summary: "Finds the largest of three numbers with if-else",
  heading: "Largest of Three Numbers in {language}",
  description:
    "Find the largest of three numbers in {language} using if-else, explained step by step for beginners. Run the program online in your browser.",
  explanation: [
    "This program reads three whole numbers and prints the biggest one. It shows how a program can check several conditions in turn and pick the first one that is true.",
    'A number is the largest if it is bigger than or equal to both of the others. For 12, 45 and 7: is 12 at least as big as 45 and 7? No, so it is not the largest. Is 45 at least as big as 12 and 7? Yes, so 45 is the largest. If neither of the first two numbers passes the test, the third must be the largest. Using "bigger than or equal to" means the program still works when two numbers are the same.',
  ],
  steps: [
    "The program asks for three numbers and reads them from one line.",
    "It checks whether the first number is bigger than or equal to both of the others. If so, that is the largest.",
    "Otherwise (else if), it checks the second number against the other two in the same way.",
    "If neither test passed (else), the third number is the largest.",
    "It prints the largest number.",
  ],
  notes: {
    python: [
      "input().split() cuts the line at the spaces into three pieces of text, and map(int, ...) turns each piece into a whole number, one for each of first, second and third.",
      "Python writes else if as elif, and uses the word and to join two conditions.",
    ],
    c: [
      'scanf("%d %d %d", ...) reads three whole numbers separated by spaces. Each variable needs its own &.',
      "&& means and: both conditions must be true.",
    ],
    cpp: [
      "cin >> first >> second >> third reads three numbers one after another, skipping the spaces between them.",
      "&& means and: both conditions must be true.",
    ],
    java: [
      "nextInt() skips spaces and line breaks, so the three numbers can be on one line or on separate lines.",
      "&& means and: both conditions must be true. Java also has Math.max, but here we use if-else to learn how decisions work.",
    ],
  },
  stdin: "12 45 7\n",
  output: "Enter three numbers:\nThe largest number is 45",
  code: {
    python: String.raw`# Ask for three numbers, typed on one line with spaces between them.
print("Enter three numbers:")
first, second, third = map(int, input().split())

# A number is the largest if it is >= both of the others.
if first >= second and first >= third:
    largest = first
elif second >= first and second >= third:
    largest = second
else:
    # Neither the first nor the second is the largest.
    largest = third

print(f"The largest number is {largest}")
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int first, second, third, largest;

    // Ask for three numbers, typed on one line with spaces between them.
    printf("Enter three numbers:\n");
    scanf("%d %d %d", &first, &second, &third);

    // A number is the largest if it is >= both of the others.
    if (first >= second && first >= third) {
        largest = first;
    } else if (second >= first && second >= third) {
        largest = second;
    } else {
        // Neither the first nor the second is the largest.
        largest = third;
    }

    printf("The largest number is %d\n", largest);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int first, second, third, largest;

    // Ask for three numbers, typed on one line with spaces between them.
    cout << "Enter three numbers:" << endl;
    cin >> first >> second >> third;

    // A number is the largest if it is >= both of the others.
    if (first >= second && first >= third) {
        largest = first;
    } else if (second >= first && second >= third) {
        largest = second;
    } else {
        // Neither the first nor the second is the largest.
        largest = third;
    }

    cout << "The largest number is " << largest << endl;
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // gives us Scanner, which reads input

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Ask for three numbers, typed on one line with spaces between them.
        System.out.println("Enter three numbers:");
        int first = sc.nextInt();
        int second = sc.nextInt();
        int third = sc.nextInt();

        // A number is the largest if it is >= both of the others.
        int largest;
        if (first >= second && first >= third) {
            largest = first;
        } else if (second >= first && second >= third) {
            largest = second;
        } else {
            // Neither the first nor the second is the largest.
            largest = third;
        }

        System.out.println("The largest number is " + largest);
    }
}
`,
  },
};
