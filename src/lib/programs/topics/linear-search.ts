import type { Program } from "../types";

export const program: Program = {
  slug: "linear-search",
  level: "beginner",
  topic: "Arrays",
  name: "Linear search",
  summary: "Finds a number in an array",
  heading: "Linear Search Program in {language}",
  description:
    "Linear search program in {language}: find a number in an array by checking each element. Explained for beginners; run it online in your browser.",
  explanation: [
    "Searching means finding out whether a value is in a list, and where. Linear search is the simplest way to do it: start at the first element and check each one in turn, until you find the value or reach the end.",
    "For the numbers 12, 7, 25, 3, 18 and the value 25, the program checks 12 (no), 7 (no) and then 25 (yes), so it reports position 3. People count positions from 1, but array indexes count from 0, so the program adds 1 to the index. If no element matches, it says the value was not found.",
  ],
  steps: [
    "The program reads how many numbers there are, the numbers themselves, and then the value to find.",
    'position starts at 0, which here means "not found yet".',
    "A loop compares each element with the value. At the first match it stores the position (index + 1) and stops the loop with break.",
    "After the loop, if position is still 0 the value is not in the array; otherwise the program prints where it was found.",
  ],
  notes: {
    python: [
      "range(count) gives the indexes 0, 1, 2, ... up to count - 1, so i + 1 is the position counted from 1.",
      "Python can also check with 25 in numbers, but writing the loop yourself shows how a search works.",
    ],
    c: [
      "break leaves the loop at once, so the search stops at the first match.",
      "Array indexes start at 0, so numbers[2] is the 3rd number: that is why the program stores i + 1 as the position.",
    ],
    cpp: [
      "break leaves the loop at once, so the search stops at the first match.",
      "Array indexes start at 0, so numbers[2] is the 3rd number: that is why the program stores i + 1 as the position.",
    ],
    java: [
      "break leaves the loop at once, so the search stops at the first match.",
      "Array indexes start at 0, so numbers[2] is the 3rd number: that is why the program stores i + 1 as the position.",
    ],
  },
  stdin: "5\n12 7 25 3 18\n25\n",
  output:
    "Enter how many numbers:\nEnter 5 numbers:\nEnter the number to find:\nFound 25 at position 3",
  code: {
    python: String.raw`# Read the numbers into a list.
print("Enter how many numbers:")
count = int(input())
print(f"Enter {count} numbers:")
parts = input().split()  # cut the line into pieces at the spaces
numbers = []
for i in range(count):
    numbers.append(int(parts[i]))

# Read the value to look for.
print("Enter the number to find:")
target = int(input())

# Check each element in turn, starting with the first.
position = 0  # 0 means "not found yet"
for i in range(count):
    if numbers[i] == target:
        position = i + 1  # positions count from 1, indexes from 0
        break  # found it: stop searching

# Print the result.
if position == 0:
    print(target, "not found")
else:
    print("Found", target, "at position", position)
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

int main(void) {
    int numbers[100];  // room for up to 100 numbers
    int count, target;

    // Read the numbers into the array.
    printf("Enter how many numbers:\n");
    scanf("%d", &count);
    printf("Enter %d numbers:\n", count);
    for (int i = 0; i < count; i++) {
        scanf("%d", &numbers[i]);
    }

    // Read the value to look for.
    printf("Enter the number to find:\n");
    scanf("%d", &target);

    // Check each element in turn, starting with the first.
    int position = 0;  // 0 means "not found yet"
    for (int i = 0; i < count; i++) {
        if (numbers[i] == target) {
            position = i + 1;  // positions count from 1, indexes from 0
            break;  // found it: stop searching
        }
    }

    // Print the result.
    if (position == 0) {
        printf("%d not found\n", target);
    } else {
        printf("Found %d at position %d\n", target, position);
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

int main() {
    int numbers[100];  // room for up to 100 numbers
    int count, target;

    // Read the numbers into the array.
    cout << "Enter how many numbers:" << endl;
    cin >> count;
    cout << "Enter " << count << " numbers:" << endl;
    for (int i = 0; i < count; i++) {
        cin >> numbers[i];
    }

    // Read the value to look for.
    cout << "Enter the number to find:" << endl;
    cin >> target;

    // Check each element in turn, starting with the first.
    int position = 0;  // 0 means "not found yet"
    for (int i = 0; i < count; i++) {
        if (numbers[i] == target) {
            position = i + 1;  // positions count from 1, indexes from 0
            break;  // found it: stop searching
        }
    }

    // Print the result.
    if (position == 0) {
        cout << target << " not found" << endl;
    } else {
        cout << "Found " << target << " at position " << position << endl;
    }
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

        // Read the value to look for.
        System.out.println("Enter the number to find:");
        int target = sc.nextInt();

        // Check each element in turn, starting with the first.
        int position = 0;  // 0 means "not found yet"
        for (int i = 0; i < count; i++) {
            if (numbers[i] == target) {
                position = i + 1;  // positions count from 1, indexes from 0
                break;  // found it: stop searching
            }
        }

        // Print the result.
        if (position == 0) {
            System.out.println(target + " not found");
        } else {
            System.out.println("Found " + target + " at position " + position);
        }
    }
}
`,
  },
};
