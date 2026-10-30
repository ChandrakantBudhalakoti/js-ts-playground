import type { Program } from "../types";

export const program: Program = {
  slug: "simple-calculator",
  level: "beginner",
  topic: "Functions and recursion",
  name: "Simple calculator",
  summary: "Adds, subtracts, multiplies or divides two numbers",
  heading: "Simple Calculator Program in {language} Using Functions",
  description:
    "Simple calculator program in {language} using a function for + - * and /, explained for beginners. Run it online in your browser on a phone or PC.",
  explanation: [
    "This program works like a tiny calculator. You type a calculation such as 24 / 6, and it prints the answer. It knows the four basic operators: + (add), - (subtract), * (multiply) and / (divide).",
    "The working out is done in a separate function. A function is a named block of code that you hand some values (here the two numbers and the operator) and that hands back a result. Before calling it, the program checks the input: dividing by zero has no answer, so it prints a message instead, and it does the same for an operator it does not know. The division keeps only the whole-number part, so 7 / 2 gives 3.",
  ],
  steps: [
    "The program reads the first number, the operator and the second number from one line.",
    'If the operator is not +, -, * or /, it prints "Unknown operator".',
    'If the operator is / and the second number is 0, it prints "Cannot divide by zero".',
    "Otherwise it calls the calculate function, which picks the right calculation for the operator (with switch, or if and elif in Python) and returns the answer.",
    "The program prints the whole calculation with its result.",
  ],
  notes: {
    python: [
      "input().split() needs spaces between the parts, so type 24 / 6, not 24/6.",
      "// is whole-number division. For negative numbers it rounds down, so -7 // 2 is -4, while C, C++ and Java give -3.",
    ],
    c: [
      'In scanf("%d %c %d", ...), %c reads one character: the operator. The space before %c skips any spaces you type, so 24 / 6 and 24/6 both work.',
      "Each case ends with return, which leaves the function at once, so no break is needed.",
    ],
    cpp: [
      "cin >> first >> symbol >> second reads a number, one character and another number, so 24 / 6 and 24/6 both work.",
      "Each case ends with return, which leaves the function at once, so no break is needed.",
    ],
    java: [
      "sc.next() reads the operator as a short piece of text and charAt(0) takes its first character, so type spaces between the parts: 24 / 6.",
      "Dividing one int by another gives a whole number: 7 / 2 is 3, and the part after the decimal point is dropped.",
    ],
  },
  stdin: "24 / 6\n",
  output: "Enter a calculation, like 24 / 6:\n24 / 6 = 4",
  code: {
    python: String.raw`# Works out "first symbol second" and returns the answer.
def calculate(first, second, symbol):
    if symbol == "+":
        return first + second
    elif symbol == "-":
        return first - second
    elif symbol == "*":
        return first * second
    elif symbol == "/":
        return first // second  # // keeps only the whole-number part
    else:
        return 0  # never used: the operator is checked before calling


# Read a calculation like 24 / 6: a number, an operator and a number.
print("Enter a calculation, like 24 / 6:")
parts = input().split()  # cut the line into pieces at the spaces
first = int(parts[0])
symbol = parts[1]  # the operator: + - * or /
second = int(parts[2])

# Check the input, then let the function do the calculation.
if symbol != "+" and symbol != "-" and symbol != "*" and symbol != "/":
    print("Unknown operator")
elif symbol == "/" and second == 0:
    print("Cannot divide by zero")
else:
    result = calculate(first, second, symbol)
    print(first, symbol, second, "=", result)
`,
    c: String.raw`#include <stdio.h>  // gives us printf and scanf

// Works out "first symbol second" and returns the answer.
int calculate(int first, int second, char symbol) {
    switch (symbol) {
        case '+':
            return first + second;
        case '-':
            return first - second;
        case '*':
            return first * second;
        case '/':
            return first / second;  // int division keeps the whole-number part
        default:
            return 0;  // never used: main checks the operator first
    }
}

int main(void) {
    int first, second;
    char symbol;  // the operator: + - * or /

    // Read a calculation like 24 / 6: a number, an operator and a number.
    printf("Enter a calculation, like 24 / 6:\n");
    scanf("%d %c %d", &first, &symbol, &second);

    // Check the input, then let the function do the calculation.
    if (symbol != '+' && symbol != '-' && symbol != '*' && symbol != '/') {
        printf("Unknown operator\n");
    } else if (symbol == '/' && second == 0) {
        printf("Cannot divide by zero\n");
    } else {
        int result = calculate(first, second, symbol);
        printf("%d %c %d = %d\n", first, symbol, second, result);
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>  // gives us cin and cout
using namespace std;

// Works out "first symbol second" and returns the answer.
int calculate(int first, int second, char symbol) {
    switch (symbol) {
        case '+':
            return first + second;
        case '-':
            return first - second;
        case '*':
            return first * second;
        case '/':
            return first / second;  // int division keeps the whole-number part
        default:
            return 0;  // never used: main checks the operator first
    }
}

int main() {
    int first, second;
    char symbol;  // the operator: + - * or /

    // Read a calculation like 24 / 6: a number, an operator and a number.
    cout << "Enter a calculation, like 24 / 6:" << endl;
    cin >> first >> symbol >> second;

    // Check the input, then let the function do the calculation.
    if (symbol != '+' && symbol != '-' && symbol != '*' && symbol != '/') {
        cout << "Unknown operator" << endl;
    } else if (symbol == '/' && second == 0) {
        cout << "Cannot divide by zero" << endl;
    } else {
        int result = calculate(first, second, symbol);
        cout << first << " " << symbol << " " << second << " = " << result << endl;
    }
    return 0;
}
`,
    java: String.raw`import java.util.Scanner;  // lets the program read input

public class Main {
    // Works out "first symbol second" and returns the answer.
    static int calculate(int first, int second, char symbol) {
        switch (symbol) {
            case '+':
                return first + second;
            case '-':
                return first - second;
            case '*':
                return first * second;
            case '/':
                return first / second;  // int division keeps the whole-number part
            default:
                return 0;  // never used: main checks the operator first
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);  // reads from the Input tab

        // Read a calculation like 24 / 6: a number, an operator and a number.
        System.out.println("Enter a calculation, like 24 / 6:");
        int first = sc.nextInt();
        char symbol = sc.next().charAt(0);  // the operator: + - * or /
        int second = sc.nextInt();

        // Check the input, then let the function do the calculation.
        if (symbol != '+' && symbol != '-' && symbol != '*' && symbol != '/') {
            System.out.println("Unknown operator");
        } else if (symbol == '/' && second == 0) {
            System.out.println("Cannot divide by zero");
        } else {
            int result = calculate(first, second, symbol);
            System.out.println(first + " " + symbol + " " + second + " = " + result);
        }
    }
}
`,
  },
};
