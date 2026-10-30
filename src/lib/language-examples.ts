import type { CodeExample } from "@/types/playground";

/**
 * Examples for the languages that run on WebAssembly runtimes. The first
 * example of each language is its starter code. Code is written with
 * String.raw, so backslashes (as in "\n") reach the program unchanged.
 */
export const LANGUAGE_EXAMPLES: CodeExample[] = [
  // --- Python -------------------------------------------------------------
  {
    id: "py-hello",
    title: "Hello, Python",
    description: "Functions, f-strings, comprehensions and a class",
    language: "python",
    code: String.raw`from dataclasses import dataclass


@dataclass
class User:
    name: str
    languages: list[str]

    def greet(self) -> str:
        return f"Hello, {self.name}! You know {len(self.languages)} languages."


users = [
    User("Ada", ["Python", "C"]),
    User("Linus", ["C", "Go", "Rust"]),
]

for user in users:
    print(user.greet())

squares = [n * n for n in range(1, 6)]
print("Squares:", squares)

by_language: dict[str, list[str]] = {}
for user in users:
    for language in user.languages:
        by_language.setdefault(language, []).append(user.name)
print("Who knows C?", by_language["C"])
`,
  },
  {
    id: "py-input",
    title: "Reading input",
    description: "input() reads the Input panel line by line",
    language: "python",
    stdin: "Ada\n3 4 5\n",
    code: String.raw`# Programs read standard input from the Input panel (next to Console).
name = input("What is your name? ")
print(f"\nNice to meet you, {name}!")

numbers = [int(part) for part in input().split()]
print("Numbers:", numbers)
print("Sum:", sum(numbers), "Average:", sum(numbers) / len(numbers))
`,
  },
  {
    id: "py-errors",
    title: "Exceptions and tracebacks",
    description: "Handled and uncaught exceptions, with the failing line",
    language: "python",
    code: String.raw`def parse_age(text: str) -> int:
    age = int(text)
    if age < 0:
        raise ValueError("age cannot be negative")
    return age


for text in ["42", "abc", "-1"]:
    try:
        print("Parsed:", parse_age(text))
    except ValueError as error:
        print(f"Could not parse {text!r}: {error}")


def average(values: list[float]) -> float:
    return sum(values) / len(values)


print(average([1, 2, 3]))
print(average([]))  # Uncaught: the console links to the line that failed
`,
  },

  // --- C ------------------------------------------------------------------
  {
    id: "c-hello",
    title: "Hello, C",
    description: "printf, arrays, structs and functions",
    language: "c",
    code: String.raw`#include <stdio.h>
#include <string.h>

struct Point {
    int x, y;
};

static int manhattan(struct Point a, struct Point b) {
    int dx = a.x > b.x ? a.x - b.x : b.x - a.x;
    int dy = a.y > b.y ? a.y - b.y : b.y - a.y;
    return dx + dy;
}

int main(void) {
    printf("Hello, C!\n");

    int primes[10];
    int count = 0;
    for (int n = 2; count < 10; n++) {
        int is_prime = 1;
        for (int d = 2; d * d <= n; d++)
            if (n % d == 0) { is_prime = 0; break; }
        if (is_prime) primes[count++] = n;
    }
    printf("First %d primes:", count);
    for (int i = 0; i < count; i++) printf(" %d", primes[i]);
    printf("\n");

    struct Point a = {1, 2}, b = {4, -2};
    printf("Distance from (%d, %d) to (%d, %d): %d\n", a.x, a.y, b.x, b.y, manhattan(a, b));

    char word[] = "playground";
    printf("\"%s\" has %zu letters\n", word, strlen(word));
    return 0;
}
`,
  },
  {
    id: "c-input",
    title: "Reading input",
    description: "scanf reads numbers from the Input panel",
    language: "c",
    stdin: "5\n3 9 1 7 4\n",
    code: String.raw`#include <stdio.h>

// Standard input comes from the Input panel (next to Console).
int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) {
        fprintf(stderr, "Expected a count first\n");
        return 1;
    }
    int max = 0;
    long sum = 0;
    for (int i = 0; i < n; i++) {
        int value;
        if (scanf("%d", &value) != 1) {
            fprintf(stderr, "Expected %d numbers, got %d\n", n, i);
            return 1;
        }
        sum += value;
        if (i == 0 || value > max) max = value;
    }
    printf("Read %d numbers: sum %ld, max %d, average %.2f\n", n, sum, max, (double)sum / n);
    return 0;
}
`,
  },
  {
    id: "c-pointers",
    title: "Pointers and memory",
    description: "A linked list with malloc and free",
    language: "c",
    code: String.raw`#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

static Node *push(Node *head, int value) {
    Node *node = malloc(sizeof *node);
    if (!node) {
        perror("malloc");
        exit(1);
    }
    node->value = value;
    node->next = head;
    return node;
}

static Node *reverse(Node *head) {
    Node *previous = NULL;
    while (head) {
        Node *next = head->next;
        head->next = previous;
        previous = head;
        head = next;
    }
    return previous;
}

static void print(const char *label, const Node *head) {
    printf("%s:", label);
    for (; head; head = head->next) printf(" %d", head->value);
    printf("\n");
}

int main(void) {
    Node *list = NULL;
    for (int i = 1; i <= 5; i++) list = push(list, i * i);
    print("List", list);
    list = reverse(list);
    print("Reversed", list);

    while (list) {
        Node *next = list->next;
        free(list);
        list = next;
    }
    printf("Freed every node\n");
    return 0;
}
`,
  },

  // --- C++ ----------------------------------------------------------------
  {
    id: "cpp-hello",
    title: "Hello, C++",
    description: "iostream, strings, vectors and a class",
    language: "cpp",
    code: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual std::string name() const = 0;
};

class Rectangle : public Shape {
public:
    Rectangle(double w, double h) : w_(w), h_(h) {}
    double area() const override { return w_ * h_; }
    std::string name() const override { return "rectangle"; }

private:
    double w_, h_;
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.14159265 * r_ * r_; }
    std::string name() const override { return "circle"; }

private:
    double r_;
};

int main() {
    std::cout << "Hello, C++!" << '\n';

    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Rectangle>(3, 4));
    shapes.push_back(std::make_unique<Circle>(1.5));

    double total = 0;
    for (const auto &shape : shapes) {
        std::cout << "A " << shape->name() << " with area " << shape->area() << '\n';
        total += shape->area();
    }
    std::cout << "Total area: " << total << std::endl;
}
`,
  },
  {
    id: "cpp-stl",
    title: "STL containers and algorithms",
    description: "map, set, sort and lambdas",
    language: "cpp",
    code: String.raw`#include <algorithm>
#include <iostream>
#include <map>
#include <numeric>
#include <set>
#include <sstream>
#include <string>
#include <vector>

int main() {
    std::string text = "the quick brown fox jumps over the lazy dog the end";
    std::istringstream words(text);

    std::map<std::string, int> counts;
    for (std::string word; words >> word;) ++counts[word];

    std::vector<std::pair<std::string, int>> ranked(counts.begin(), counts.end());
    std::sort(ranked.begin(), ranked.end(), [](const auto &a, const auto &b) {
        return a.second != b.second ? a.second > b.second : a.first < b.first;
    });

    std::cout << "Most common words:\n";
    for (std::size_t i = 0; i < 3 && i < ranked.size(); ++i)
        std::cout << "  " << ranked[i].first << ": " << ranked[i].second << '\n';

    std::set<char> letters(text.begin(), text.end());
    letters.erase(' ');
    std::cout << "Distinct letters: " << letters.size() << '\n';

    std::vector<int> numbers(10);
    std::iota(numbers.begin(), numbers.end(), 1);
    int evens = std::count_if(numbers.begin(), numbers.end(), [](int n) { return n % 2 == 0; });
    std::cout << "Sum 1..10 = " << std::accumulate(numbers.begin(), numbers.end(), 0)
              << ", even numbers: " << evens << std::endl;
}
`,
  },
  {
    id: "cpp-input",
    title: "Reading input",
    description: "std::cin and std::getline read the Input panel",
    language: "cpp",
    stdin: "Grace\nC++ Python Go\n",
    code: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>

// Standard input comes from the Input panel (next to Console).
int main() {
    std::string name;
    std::getline(std::cin, name);
    std::cout << "Hello, " << name << "!\n";

    std::string line;
    std::getline(std::cin, line);
    std::istringstream stream(line);
    std::vector<std::string> languages;
    for (std::string language; stream >> language;) languages.push_back(language);

    std::cout << "You listed " << languages.size() << " languages:";
    for (const auto &language : languages) std::cout << ' ' << language;
    std::cout << std::endl;
}
`,
  },

  // --- Java -----------------------------------------------------------------
  {
    id: "java-hello",
    title: "Hello, Java",
    description: "A Scanner reads your name from the Input tab",
    language: "java",
    stdin: "Riya\n",
    code: String.raw`import java.util.Scanner;

// Every Java program lives in a class. This one is called Main.
public class Main {
    // The program starts in the main method.
    public static void main(String[] args) {
        // Scanner reads what you type in the Input tab.
        Scanner sc = new Scanner(System.in);

        System.out.println("What is your name?");
        String name = sc.nextLine();

        System.out.println("Hello, " + name + "! Welcome to Java.");
    }
}
`,
  },
  {
    id: "java-classes",
    title: "Classes and objects",
    description: "A Student class with fields, a constructor and methods",
    language: "java",
    code: String.raw`// A class is a blueprint: every Student has a name and marks.
class Student {
    private String name;
    private int[] marks;

    // The constructor runs when a new Student is made.
    Student(String name, int[] marks) {
        this.name = name;
        this.marks = marks;
    }

    int total() {
        int sum = 0;
        for (int mark : marks) {
            sum += mark;
        }
        return sum;
    }

    // Rounded to one decimal place.
    double average() {
        return Math.round(total() * 10.0 / marks.length) / 10.0;
    }

    String grade() {
        double average = average();
        if (average >= 90) return "A";
        if (average >= 75) return "B";
        return "C";
    }

    String getName() {
        return name;
    }
}

public class Main {
    public static void main(String[] args) {
        Student[] students = {
            new Student("Asha", new int[] {92, 88, 95}),
            new Student("Kabir", new int[] {78, 81, 72}),
            new Student("Meera", new int[] {64, 70, 59}),
        };
        for (Student student : students) {
            System.out.println(student.getName() + ": total " + student.total()
                    + ", average " + student.average() + ", grade " + student.grade());
        }
    }
}
`,
  },
  {
    id: "java-input",
    title: "Reading numbers",
    description: "nextInt reads numbers from the Input tab in a loop",
    language: "java",
    stdin: "4\n12 7 30 11\n",
    code: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // The first number says how many follow.
        int count = sc.nextInt();
        int total = 0;
        int largest = Integer.MIN_VALUE;
        for (int i = 0; i < count; i++) {
            int number = sc.nextInt();
            total += number;
            largest = Math.max(largest, number);
        }
        System.out.println("Read " + count + " numbers");
        System.out.println("Total: " + total + ", largest: " + largest);
    }
}
`,
  },

  // --- Go -----------------------------------------------------------------
  {
    id: "go-hello",
    title: "Hello, Go",
    description: "Structs, methods, slices, maps and interfaces",
    language: "go",
    code: String.raw`package main

import (
	"fmt"
	"sort"
	"strings"
)

type Shape interface {
	Area() float64
	Name() string
}

type Rect struct{ W, H float64 }
type Square struct{ Side float64 }

func (r Rect) Area() float64   { return r.W * r.H }
func (r Rect) Name() string    { return "rectangle" }
func (s Square) Area() float64 { return s.Side * s.Side }
func (s Square) Name() string  { return "square" }

func main() {
	fmt.Println("Hello, Go!")

	shapes := []Shape{Rect{3, 4}, Square{2}, Rect{1, 10}}
	sort.Slice(shapes, func(i, j int) bool { return shapes[i].Area() < shapes[j].Area() })
	for _, s := range shapes {
		fmt.Printf("%-9s area %5.1f\n", s.Name(), s.Area())
	}

	counts := map[string]int{}
	for _, word := range strings.Fields("go is fun and go is fast") {
		counts[word]++
	}
	fmt.Println("Word counts:", counts)
}
`,
  },
  {
    id: "go-concurrency",
    title: "Goroutines and channels",
    description: "A worker pool with a WaitGroup",
    language: "go",
    code: String.raw`package main

import (
	"fmt"
	"sync"
)

func square(id int, jobs <-chan int, results chan<- string, wg *sync.WaitGroup) {
	defer wg.Done()
	for n := range jobs {
		results <- fmt.Sprintf("worker %d: %d² = %d", id, n, n*n)
	}
}

func main() {
	jobs := make(chan int, 10)
	results := make(chan string, 10)
	var wg sync.WaitGroup

	for id := 1; id <= 3; id++ {
		wg.Add(1)
		go square(id, jobs, results, &wg)
	}
	for n := 1; n <= 6; n++ {
		jobs <- n
	}
	close(jobs)

	wg.Wait()
	close(results)
	count := 0
	for result := range results {
		fmt.Println(result)
		count++
	}
	fmt.Println(count, "results")
}
`,
  },
  {
    id: "go-input",
    title: "Reading input",
    description: "bufio.Scanner reads the Input panel line by line",
    language: "go",
    stdin: "apple 3\nbanana 5\ncherry 2\n",
    code: String.raw`package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Standard input comes from the Input panel (next to Console).
func main() {
	scanner := bufio.NewScanner(os.Stdin)
	total := 0
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) != 2 {
			continue
		}
		count, err := strconv.Atoi(fields[1])
		if err != nil {
			fmt.Fprintln(os.Stderr, "not a number:", fields[1])
			continue
		}
		fmt.Printf("%-8s %d\n", fields[0], count)
		total += count
	}
	fmt.Println("Total:", total)
}
`,
  },

  // --- Ruby ---------------------------------------------------------------
  {
    id: "rb-hello",
    title: "Hello, Ruby",
    description: "Classes, blocks, hashes and string interpolation",
    language: "ruby",
    code: String.raw`class Book
  attr_reader :title, :year

  def initialize(title, year)
    @title = title
    @year = year
  end

  def to_s = "#{title} (#{year})"
end

puts "Hello, Ruby!"

books = [
  Book.new("Dune", 1965),
  Book.new("Neuromancer", 1984),
  Book.new("Snow Crash", 1992),
]

books.sort_by(&:year).each_with_index do |book, index|
  puts "#{index + 1}. #{book}"
end

by_decade = books.group_by { |book| book.year / 10 * 10 }
by_decade.each { |decade, list| puts "#{decade}s: #{list.map(&:title).join(", ")}" }

puts "Sum of the even numbers up to 10: #{(1..10).select(&:even?).sum}"
`,
  },
  {
    id: "rb-input",
    title: "Reading input",
    description: "gets reads the Input panel line by line",
    language: "ruby",
    stdin: "Ruby\n10 20 30\n",
    code: String.raw`# Standard input comes from the Input panel (next to Console).
name = gets&.chomp
puts "Hello, #{name}!"

numbers = gets.to_s.split.map(&:to_i)
puts "Numbers: #{numbers.inspect}"
puts "Total: #{numbers.sum}, largest: #{numbers.max}"
`,
  },

  // --- PHP ----------------------------------------------------------------
  {
    id: "php-hello",
    title: "Hello, PHP",
    description: "Arrays, functions, classes and string formatting",
    language: "php",
    code: String.raw`<?php

declare(strict_types=1);

final class Product
{
    public function __construct(
        public readonly string $name,
        public readonly float $price,
        public readonly int $stock,
    ) {}

    public function value(): float
    {
        return $this->price * $this->stock;
    }
}

echo "Hello, PHP " . PHP_VERSION . "!\n";

$products = [
    new Product("Keyboard", 49.99, 12),
    new Product("Mouse", 19.50, 40),
    new Product("Monitor", 189.00, 3),
];

usort($products, fn (Product $a, Product $b) => $b->value() <=> $a->value());

foreach ($products as $product) {
    printf("%-10s %3d × %7.2f = %8.2f\n", $product->name, $product->stock, $product->price, $product->value());
}

$total = array_sum(array_map(fn (Product $p) => $p->value(), $products));
echo "Inventory value: " . number_format($total, 2) . "\n";
echo json_encode(array_column(array_map(fn ($p) => (array) $p, $products), "stock", "name")), "\n";
`,
  },
  {
    id: "php-input",
    title: "Reading input",
    description: "fgets(STDIN) reads the Input panel",
    language: "php",
    stdin: "PHP\n4 8 15 16 23 42\n",
    code: String.raw`<?php

// Standard input comes from the Input panel (next to Console).
$name = trim((string) fgets(STDIN));
echo "Hello, {$name}!\n";

$numbers = array_map("intval", preg_split('/\s+/', trim((string) fgets(STDIN))));
echo "Numbers: " . implode(", ", $numbers) . "\n";
echo "Sum: " . array_sum($numbers) . ", max: " . max($numbers) . "\n";
`,
  },

  // --- Lua ----------------------------------------------------------------
  {
    id: "lua-hello",
    title: "Hello, Lua",
    description: "Tables, closures and string formatting",
    language: "lua",
    code: String.raw`print("Hello, Lua!")

local function counter()
  local count = 0
  return function()
    count = count + 1
    return count
  end
end

local next_id = counter()
local people = {
  { id = next_id(), name = "Ada", age = 36 },
  { id = next_id(), name = "Grace", age = 45 },
  { id = next_id(), name = "Linus", age = 21 },
}

table.sort(people, function(a, b) return a.age < b.age end)
for _, person in ipairs(people) do
  print(string.format("#%d %-6s %3d", person.id, person.name, person.age))
end

local total = 0
for _, person in ipairs(people) do total = total + person.age end
io.write("Average age: ", total / #people, "\n")
`,
  },
  {
    id: "lua-input",
    title: "Reading input",
    description: "io.read reads the Input panel",
    language: "lua",
    stdin: "Lua\n7 11 13\n",
    code: String.raw`-- Standard input comes from the Input panel (next to Console).
local name = io.read("l")
print("Hello, " .. name .. "!")

local sum, count = 0, 0
for number in io.read("l"):gmatch("%d+") do
  sum = sum + tonumber(number)
  count = count + 1
end
print(string.format("%d numbers, sum %d", count, sum))
`,
  },

  // --- R ------------------------------------------------------------------
  {
    id: "r-hello",
    title: "Hello, R",
    description: "Vectors, functions and a data frame",
    language: "r",
    code: String.raw`cat("Hello, R!\n")

scores <- c(Ada = 92, Grace = 88, Linus = 75, Margaret = 97)
print(scores)
cat("Mean:", mean(scores), " Best:", names(which.max(scores)), "\n")

grade <- function(score) {
  if (score >= 90) "A" else if (score >= 80) "B" else "C"
}
print(sapply(scores, grade))

people <- data.frame(
  name = names(scores),
  score = unname(scores),
  language = c("R", "COBOL", "C", "Assembly")
)
people[order(-people$score), ]
`,
  },
  {
    id: "r-stats",
    title: "Statistics with built-in data",
    description: "summary(), aggregate() and a linear model on mtcars",
    language: "r",
    code: String.raw`# mtcars ships with R: fuel consumption and design of 32 cars.
head(mtcars[, c("mpg", "cyl", "wt", "hp")])

summary(mtcars$mpg)

# Average miles per gallon by number of cylinders
aggregate(mpg ~ cyl, data = mtcars, FUN = mean)

# Heavier cars use more fuel: fit mpg against weight
model <- lm(mpg ~ wt, data = mtcars)
coef(model)
cat(sprintf("Each 1000 lb costs about %.1f mpg (R² = %.2f)\n",
            -coef(model)[["wt"]], summary(model)$r.squared))
`,
  },
];
