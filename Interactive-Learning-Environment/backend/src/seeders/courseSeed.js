const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/Course');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const connectDB = require('../config/database');

// Load environment variables
dotenv.config();

// Seed data for courses
const coursesData = [
  {
    title: 'Introduction to Python',
    description: 'Learn Python programming basics in a fun and interactive way! Perfect for beginners who want to start their coding journey.',
    targetGrades: [4, 5, 6, 7, 8],
    difficulty: 'beginner',
    topics: ['Variables', 'Data Types', 'Loops', 'Functions', 'Lists', 'Conditionals'],
    isPublished: true,
    lessons: [
      {
        title: 'Getting Started with Python',
        description: 'Learn what Python is and write your first program!',
        order: 1,
        content: `# Welcome to Python!

Python is a friendly programming language that's easy to learn and fun to use!

## What is Python?
Python is like giving instructions to a computer, but in a language that's easier for humans to understand.

## Your First Program
Let's write a program that says "Hello, World!"

\`\`\`python
print("Hello, World!")
\`\`\`

The \`print()\` function tells the computer to display something on the screen.

## Try It Yourself!
Try printing your own messages! You can print:
- Your name
- Your favorite color
- A fun joke

## Fun Fact
Python is named after Monty Python's Flying Circus, a comedy show, not the snake! 🐍`
      },
      {
        title: 'Variables and Data Types',
        description: 'Learn how to store and use information in your programs',
        order: 2,
        content: `# Variables: Storing Information

Variables are like boxes where you can store information to use later!

## What is a Variable?
Think of a variable as a labeled box. You can put things in it and take them out whenever you need them.

## Creating Variables
\`\`\`python
name = "Alex"
age = 10
favorite_number = 7
is_student = True
\`\`\`

## Data Types
- **String**: Text, like "Hello" or "Python"
- **Integer**: Whole numbers, like 5, 10, 100
- **Float**: Decimal numbers, like 3.14, 2.5
- **Boolean**: True or False

## Using Variables
\`\`\`python
name = "Sam"
age = 11
print("My name is " + name)
print("I am " + str(age) + " years old")
\`\`\`

## Challenge
Create variables for your favorite things and print them!`
      },
      {
        title: 'Conditionals: Making Decisions',
        description: 'Learn how to make your programs smart with if statements',
        order: 3,
        content: `# Making Decisions with If Statements

Programs can make decisions just like you do!

## The If Statement
An if statement checks if something is true, then does something.

\`\`\`python
age = 10

if age >= 10:
    print("You can ride the rollercoaster!")
\`\`\`

## If-Else
What if the condition is not true? Use else!

\`\`\`python
temperature = 75

if temperature > 80:
    print("It's hot! Go swimming!")
else:
    print("Perfect weather for a walk!")
\`\`\`

## If-Elif-Else
For multiple conditions:

\`\`\`python
score = 85

if score >= 90:
    print("A - Amazing!")
elif score >= 80:
    print("B - Great job!")
elif score >= 70:
    print("C - Good!")
else:
    print("Keep practicing!")
\`\`\`

## Remember
- Use \`==\` to check if things are equal
- Use \`>\` and \`<\` to compare numbers
- Indent your code (4 spaces) inside if blocks!`
      },
      {
        title: 'Loops: Repeating Actions',
        description: 'Learn how to repeat actions without writing the same code over and over',
        order: 4,
        content: `# Loops: The Power of Repetition

Why write the same code 100 times when you can use a loop?

## For Loops
For loops repeat actions a specific number of times.

\`\`\`python
# Count to 5
for i in range(5):
    print(i)
\`\`\`

## Loop Through Lists
\`\`\`python
fruits = ["apple", "banana", "orange"]

for fruit in fruits:
    print("I like " + fruit)
\`\`\`

## While Loops
While loops keep going as long as a condition is true.

\`\`\`python
count = 0

while count < 5:
    print("Count is " + str(count))
    count = count + 1
\`\`\`

## Fun Example: Countdown
\`\`\`python
for i in range(10, 0, -1):
    print(i)
print("Blast off! 🚀")
\`\`\`

## Remember
- Use \`range(n)\` to repeat n times
- Don't forget to update your counter in while loops!
- Indent code inside loops`
      },
      {
        title: 'Functions: Reusable Code',
        description: 'Learn how to create your own functions to organize code',
        order: 5,
        content: `# Functions: Building Blocks of Code

Functions are like recipes - write once, use many times!

## What is a Function?
A function is a reusable block of code that performs a specific task.

## Creating Functions
\`\`\`python
def greet():
    print("Hello there!")

# Call the function
greet()
\`\`\`

## Functions with Parameters
\`\`\`python
def greet_person(name):
    print("Hello, " + name + "!")

greet_person("Alex")
greet_person("Sam")
\`\`\`

## Functions that Return Values
\`\`\`python
def add_numbers(a, b):
    return a + b

result = add_numbers(5, 3)
print(result)  # Prints 8
\`\`\`

## Multiple Parameters
\`\`\`python
def introduce(name, age, hobby):
    print("I'm " + name)
    print("I'm " + str(age) + " years old")
    print("I love " + hobby)

introduce("Jordan", 11, "coding")
\`\`\`

## Why Use Functions?
- Organize your code
- Avoid repeating yourself
- Make code easier to understand
- Test small pieces separately`
      }
    ]
  },
  {
    title: 'HTML & CSS Basics',
    description: 'Build your first website! Learn HTML to create web pages and CSS to make them beautiful.',
    targetGrades: [5, 6, 7, 8, 9],
    difficulty: 'beginner',
    topics: ['HTML Structure', 'HTML Tags', 'CSS Styling', 'Colors and Fonts', 'Layout', 'Responsive Design'],
    isPublished: true,
    lessons: [
      {
        title: 'Introduction to HTML',
        description: 'Learn the building blocks of all websites',
        order: 1,
        content: `# Welcome to HTML!

HTML stands for HyperText Markup Language. It's the language used to create web pages!

## What is HTML?
HTML is like the skeleton of a website. It tells the browser what content to display.

## Basic HTML Structure
\`\`\`html
<!DOCTYPE html>
<html>
  <head>
    <title>My First Web Page</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>This is my first web page.</p>
  </body>
</html>
\`\`\`

## HTML Tags
HTML uses tags (like instructions) to structure content:
- \`<h1>\` to \`<h6>\`: Headings (h1 is biggest)
- \`<p>\`: Paragraphs
- \`<a>\`: Links
- \`<img>\`: Images
- \`<div>\`: Container boxes

## Fun Fact
The first website ever created is still online! It was made in 1991.

## Your Turn!
Try creating a simple HTML page with:
- A heading with your name
- A paragraph about yourself
- Your favorite hobby`
      },
      {
        title: 'HTML Tags and Elements',
        description: 'Master the most important HTML tags',
        order: 2,
        content: `# Essential HTML Tags

Let's learn the tags you'll use all the time!

## Headings
\`\`\`html
<h1>Main Title</h1>
<h2>Subtitle</h2>
<h3>Section Title</h3>
\`\`\`

## Text Formatting
\`\`\`html
<p>A paragraph of text</p>
<strong>Bold text</strong>
<em>Italic text</em>
<br> <!-- Line break -->
\`\`\`

## Lists
Unordered list (bullets):
\`\`\`html
<ul>
  <li>Apples</li>
  <li>Bananas</li>
  <li>Oranges</li>
</ul>
\`\`\`

Ordered list (numbers):
\`\`\`html
<ol>
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
</ol>
\`\`\`

## Links
\`\`\`html
<a href="https://www.example.com">Click here!</a>
\`\`\`

## Images
\`\`\`html
<img src="picture.jpg" alt="Description of image">
\`\`\`

## Containers
\`\`\`html
<div>
  <h2>A section of content</h2>
  <p>Content goes here</p>
</div>
\`\`\`

## Remember
- Most tags need an opening tag \`<tag>\` and closing tag \`</tag>\`
- Some tags like \`<br>\` and \`<img>\` are self-closing
- Always add alt text to images for accessibility!`
      },
      {
        title: 'Introduction to CSS',
        description: 'Make your websites look amazing with CSS',
        order: 3,
        content: `# Styling with CSS

CSS (Cascading Style Sheets) makes websites beautiful!

## What is CSS?
If HTML is the skeleton, CSS is the clothes, paint, and decorations!

## Three Ways to Add CSS

### 1. Inline CSS
\`\`\`html
<p style="color: blue;">Blue text</p>
\`\`\`

### 2. Internal CSS
\`\`\`html
<head>
  <style>
    p {
      color: blue;
    }
  </style>
</head>
\`\`\`

### 3. External CSS (Best Practice!)
\`\`\`html
<head>
  <link rel="stylesheet" href="styles.css">
</head>
\`\`\`

## CSS Syntax
\`\`\`css
selector {
  property: value;
}
\`\`\`

## Common Properties
\`\`\`css
/* Text */
color: blue;
font-size: 20px;
font-family: Arial;

/* Background */
background-color: yellow;

/* Size */
width: 300px;
height: 200px;

/* Spacing */
margin: 10px;
padding: 15px;
\`\`\`

## Example
\`\`\`css
h1 {
  color: purple;
  font-size: 36px;
  text-align: center;
}

p {
  color: darkgray;
  font-size: 16px;
  line-height: 1.5;
}
\`\`\`

## Pro Tip
Start with external CSS files to keep your code organized!`
      },
      {
        title: 'Colors and Fonts',
        description: 'Learn how to choose and apply colors and fonts',
        order: 4,
        content: `# Colors and Typography

Make your website unique with colors and fonts!

## CSS Colors

### Color Names
\`\`\`css
color: red;
background-color: lightblue;
\`\`\`

### Hex Colors
\`\`\`css
color: #FF5733;  /* Orange */
color: #3498DB;  /* Blue */
color: #2ECC71;  /* Green */
\`\`\`

### RGB Colors
\`\`\`css
color: rgb(255, 87, 51);
color: rgba(52, 152, 219, 0.5);  /* Last number is transparency */
\`\`\`

## Fonts

### Font Family
\`\`\`css
font-family: Arial, sans-serif;
font-family: 'Times New Roman', serif;
font-family: 'Courier New', monospace;
\`\`\`

### Font Size
\`\`\`css
font-size: 16px;
font-size: 1.5em;
font-size: 2rem;
\`\`\`

### Font Weight and Style
\`\`\`css
font-weight: bold;
font-weight: 600;
font-style: italic;
\`\`\`

## Text Properties
\`\`\`css
text-align: center;
text-decoration: underline;
text-transform: uppercase;
letter-spacing: 2px;
line-height: 1.6;
\`\`\`

## Complete Example
\`\`\`css
.cool-title {
  font-family: Arial, sans-serif;
  font-size: 48px;
  font-weight: bold;
  color: #3498DB;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}
\`\`\`

## Color Tips
- Use a color palette (3-5 colors)
- Make sure text is readable
- Light text on dark backgrounds (or vice versa)
- Test your colors together!`
      },
      {
        title: 'Layout with CSS',
        description: 'Position elements and create layouts',
        order: 5,
        content: `# CSS Layout Basics

Learn to arrange elements on your page!

## The Box Model
Every HTML element is a box!

\`\`\`css
.box {
  width: 300px;
  height: 200px;
  padding: 20px;    /* Space inside the box */
  border: 2px solid black;
  margin: 10px;     /* Space outside the box */
}
\`\`\`

## Display Property
\`\`\`css
/* Block: Takes full width */
display: block;

/* Inline: Only takes needed width */
display: inline;

/* Inline-block: Best of both! */
display: inline-block;

/* None: Hide element */
display: none;
\`\`\`

## Flexbox - Modern Layout
\`\`\`css
.container {
  display: flex;
  justify-content: center;  /* Horizontal alignment */
  align-items: center;      /* Vertical alignment */
  gap: 20px;               /* Space between items */
}
\`\`\`

## Common Layouts

### Centered Content
\`\`\`css
.center {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
\`\`\`

### Two Columns
\`\`\`css
.container {
  display: flex;
}

.column {
  flex: 1;
  padding: 20px;
}
\`\`\`

### Card Layout
\`\`\`css
.card {
  width: 300px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  background: white;
}
\`\`\`

## Position Property
\`\`\`css
position: relative;  /* Move relative to normal position */
position: absolute;  /* Position relative to parent */
position: fixed;     /* Fixed to viewport (scrolling) */
position: sticky;    /* Sticks when scrolling */
\`\`\`

## Pro Tips
- Use Flexbox for most layouts
- Keep it simple at first
- Test on different screen sizes
- Use browser dev tools to debug!`
      }
    ]
  },
  {
    title: 'JavaScript Fun Basics',
    description: 'Make your websites interactive! Learn JavaScript to add animations, games, and dynamic features.',
    targetGrades: [6, 7, 8, 9, 10],
    difficulty: 'beginner',
    topics: ['Variables', 'Functions', 'DOM Manipulation', 'Events', 'Arrays', 'Objects'],
    isPublished: true,
    lessons: [
      {
        title: 'Introduction to JavaScript',
        description: 'Learn what JavaScript can do and write your first script',
        order: 1,
        content: `# Welcome to JavaScript!

JavaScript makes websites interactive and fun!

## What is JavaScript?
JavaScript is a programming language that runs in web browsers. It's what makes websites come alive!

## What Can You Do?
- Respond to button clicks
- Create animations
- Build games
- Validate forms
- Fetch data from servers
- And so much more!

## Your First JavaScript
\`\`\`html
<button onclick="alert('Hello!')">Click Me!</button>
\`\`\`

## Adding JavaScript to HTML

### Inline (quick tests)
\`\`\`html
<button onclick="console.log('Clicked!')">Click</button>
\`\`\`

### Internal (in HTML file)
\`\`\`html
<script>
  console.log("Hello from JavaScript!");
</script>
\`\`\`

### External (best practice)
\`\`\`html
<script src="script.js"></script>
\`\`\`

## Console.log - Your Best Friend
\`\`\`javascript
console.log("Hello, World!");
console.log(5 + 3);
console.log("My age is " + 11);
\`\`\`

## Comments
\`\`\`javascript
// This is a single line comment

/*
  This is a
  multi-line comment
*/
\`\`\`

## Fun Fact
JavaScript was created in just 10 days in 1995!

## Where to Write Code
- Browser console (F12 or right-click → Inspect)
- HTML file with <script> tags
- Separate .js files`
      },
      {
        title: 'Variables and Data Types',
        description: 'Store and work with different types of information',
        order: 2,
        content: `# JavaScript Variables

Learn to store and use data in your programs!

## Creating Variables
\`\`\`javascript
let name = "Alex";
let age = 12;
const favoriteColor = "blue";  // const = cannot change
\`\`\`

## Variable Rules
- Use \`let\` for values that change
- Use \`const\` for values that don't change
- Names can't start with numbers
- Use camelCase: myVariableName

## Data Types

### Numbers
\`\`\`javascript
let score = 100;
let pi = 3.14;
let result = score + 50;
\`\`\`

### Strings (Text)
\`\`\`javascript
let message = "Hello!";
let name = 'Sam';
let greeting = \`Hi, \${name}!\`;  // Template literal
\`\`\`

### Booleans (True/False)
\`\`\`javascript
let isStudent = true;
let isTeacher = false;
\`\`\`

### Arrays (Lists)
\`\`\`javascript
let fruits = ["apple", "banana", "orange"];
let numbers = [1, 2, 3, 4, 5];

console.log(fruits[0]);  // "apple"
fruits.push("grape");    // Add to end
\`\`\`

### Objects
\`\`\`javascript
let student = {
  name: "Jordan",
  age: 13,
  grade: 7,
  favorites: ["math", "science"]
};

console.log(student.name);  // "Jordan"
\`\`\`

## Math Operations
\`\`\`javascript
let sum = 5 + 3;        // 8
let difference = 10 - 4; // 6
let product = 3 * 4;     // 12
let quotient = 20 / 4;   // 5
let remainder = 10 % 3;  // 1
\`\`\`

## String Operations
\`\`\`javascript
let first = "Hello";
let last = "World";
let full = first + " " + last;  // "Hello World"

let message = "JavaScript";
console.log(message.length);      // 10
console.log(message.toLowerCase()); // "javascript"
console.log(message.toUpperCase()); // "JAVASCRIPT"
\`\`\`

## Practice!
Try creating variables for:
- Your name
- Your age
- Your hobbies (array)
- Your favorite things (object)`
      },
      {
        title: 'Functions in JavaScript',
        description: 'Create reusable code with functions',
        order: 3,
        content: `# JavaScript Functions

Functions are blocks of code you can use again and again!

## Basic Function
\`\`\`javascript
function sayHello() {
  console.log("Hello!");
}

sayHello();  // Call the function
\`\`\`

## Functions with Parameters
\`\`\`javascript
function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("Alex");  // "Hello, Alex!"
greet("Sam");   // "Hello, Sam!"
\`\`\`

## Return Values
\`\`\`javascript
function add(a, b) {
  return a + b;
}

let result = add(5, 3);
console.log(result);  // 8
\`\`\`

## Arrow Functions (Modern Way)
\`\`\`javascript
const multiply = (a, b) => {
  return a * b;
};

// Short version (one line)
const square = x => x * x;

console.log(square(5));  // 25
\`\`\`

## Multiple Parameters
\`\`\`javascript
function introduce(name, age, hobby) {
  console.log(\`Hi! I'm \${name}\`);
  console.log(\`I'm \${age} years old\`);
  console.log(\`I love \${hobby}\`);
}

introduce("Jordan", 12, "coding");
\`\`\`

## Default Parameters
\`\`\`javascript
function greet(name = "friend") {
  console.log("Hello, " + name + "!");
}

greet();        // "Hello, friend!"
greet("Alex");  // "Hello, Alex!"
\`\`\`

## Function Examples

### Calculator
\`\`\`javascript
function calculator(num1, num2, operation) {
  if (operation === "add") {
    return num1 + num2;
  } else if (operation === "subtract") {
    return num1 - num2;
  } else if (operation === "multiply") {
    return num1 * num2;
  }
}

console.log(calculator(10, 5, "add"));  // 15
\`\`\`

### Check Even/Odd
\`\`\`javascript
function isEven(number) {
  return number % 2 === 0;
}

console.log(isEven(4));   // true
console.log(isEven(7));   // false
\`\`\`

## Why Functions?
- Write once, use many times
- Organize your code
- Easy to test and debug
- Make code readable`
      },
      {
        title: 'DOM Manipulation',
        description: 'Change HTML and CSS with JavaScript',
        order: 4,
        content: `# The DOM - Making Pages Interactive

The DOM (Document Object Model) lets JavaScript control your webpage!

## What is the DOM?
The DOM is how JavaScript sees your HTML. Every element becomes an object you can control!

## Selecting Elements

### By ID
\`\`\`javascript
let element = document.getElementById("myId");
\`\`\`

### By Class
\`\`\`javascript
let elements = document.getElementsByClassName("myClass");
let element = document.querySelector(".myClass");
let all = document.querySelectorAll(".myClass");
\`\`\`

### By Tag
\`\`\`javascript
let paragraphs = document.getElementsByTagName("p");
\`\`\`

## Changing Content
\`\`\`javascript
// Change text
element.textContent = "New text!";
element.innerHTML = "<strong>Bold text!</strong>";

// Example
let title = document.getElementById("title");
title.textContent = "Welcome to My Site!";
\`\`\`

## Changing Styles
\`\`\`javascript
element.style.color = "blue";
element.style.fontSize = "24px";
element.style.backgroundColor = "yellow";

// Example
let box = document.getElementById("box");
box.style.width = "200px";
box.style.height = "200px";
box.style.backgroundColor = "lightblue";
\`\`\`

## Adding/Removing Classes
\`\`\`javascript
element.classList.add("active");
element.classList.remove("hidden");
element.classList.toggle("highlight");
\`\`\`

## Creating Elements
\`\`\`javascript
let newDiv = document.createElement("div");
newDiv.textContent = "I'm new!";
document.body.appendChild(newDiv);
\`\`\`

## Complete Example
\`\`\`html
<div id="counter">0</div>
<button id="btn">Click Me!</button>

<script>
  let count = 0;
  let display = document.getElementById("counter");
  let button = document.getElementById("btn");
  
  button.onclick = function() {
    count++;
    display.textContent = count;
    display.style.color = "green";
  };
</script>
\`\`\`

## Common Operations
\`\`\`javascript
// Get value from input
let value = document.getElementById("input").value;

// Hide/Show element
element.style.display = "none";  // Hide
element.style.display = "block"; // Show

// Change attributes
element.setAttribute("src", "image.jpg");
\`\`\`

## Practice Ideas
- Change colors on button click
- Create a counter
- Show/hide elements
- Build a simple quiz`
      },
      {
        title: 'Events and Interactivity',
        description: 'Respond to user actions like clicks, hovers, and keypresses',
        order: 5,
        content: `# JavaScript Events

Make your website respond to user actions!

## What are Events?
Events are things that happen in the browser:
- Clicks
- Mouse movements
- Key presses
- Page loads
- Form submissions

## Adding Event Listeners

### Method 1: onclick attribute
\`\`\`html
<button onclick="handleClick()">Click Me!</button>

<script>
  function handleClick() {
    alert("Button clicked!");
  }
</script>
\`\`\`

### Method 2: addEventListener (Best!)
\`\`\`javascript
let button = document.getElementById("btn");

button.addEventListener("click", function() {
  console.log("Button clicked!");
});
\`\`\`

## Common Events

### Click Events
\`\`\`javascript
button.addEventListener("click", () => {
  console.log("Clicked!");
});
\`\`\`

### Mouse Events
\`\`\`javascript
element.addEventListener("mouseenter", () => {
  element.style.backgroundColor = "yellow";
});

element.addEventListener("mouseleave", () => {
  element.style.backgroundColor = "white";
});
\`\`\`

### Keyboard Events
\`\`\`javascript
document.addEventListener("keypress", (event) => {
  console.log("Key pressed:", event.key);
});
\`\`\`

### Input Events
\`\`\`javascript
let input = document.getElementById("textbox");

input.addEventListener("input", (event) => {
  console.log("Current value:", event.target.value);
});
\`\`\`

## Event Object
\`\`\`javascript
button.addEventListener("click", (event) => {
  console.log("Event type:", event.type);
  console.log("Target:", event.target);
  console.log("Mouse position:", event.clientX, event.clientY);
});
\`\`\`

## Practical Examples

### Color Changer
\`\`\`javascript
let colorBtn = document.getElementById("colorBtn");
let box = document.getElementById("box");

colorBtn.addEventListener("click", () => {
  let colors = ["red", "blue", "green", "yellow", "purple"];
  let randomColor = colors[Math.floor(Math.random() * colors.length)];
  box.style.backgroundColor = randomColor;
});
\`\`\`

### Counter with Buttons
\`\`\`javascript
let count = 0;
let display = document.getElementById("display");
let increaseBtn = document.getElementById("increase");
let decreaseBtn = document.getElementById("decrease");

increaseBtn.addEventListener("click", () => {
  count++;
  display.textContent = count;
});

decreaseBtn.addEventListener("click", () => {
  count--;
  display.textContent = count;
});
\`\`\`

### Form Validation
\`\`\`javascript
let form = document.getElementById("myForm");

form.addEventListener("submit", (event) => {
  event.preventDefault();  // Stop form submission
  
  let name = document.getElementById("name").value;
  
  if (name === "") {
    alert("Please enter your name!");
  } else {
    alert("Hello, " + name + "!");
  }
});
\`\`\`

## Fun Project Ideas
- Make a clickable game
- Create an interactive story
- Build a calculator
- Design a drawing app
- Make a quiz with instant feedback

## Pro Tips
- Always use addEventListener for flexibility
- Use event.preventDefault() to stop default behavior
- Remember to select elements before adding listeners!`
      }
    ]
  }
];

// Challenges data for each course
const challengesData = [
  // Python Challenges
  {
    courseTitle: 'Introduction to Python',
    challenges: [
      {
        title: 'Hello, Python!',
        description: 'Write your first Python program that prints a greeting message.',
        difficulty: 'easy',
        objectives: [
          'Use the print() function',
          'Create a greeting message',
          'Run your first Python program'
        ],
        instructions: 'Write a program that prints "Hello, Python World!" to the console.',
        initialCode: '# Write your code here\n',
        expectedOutput: 'Hello, Python World!',
        testCases: [
          {
            input: '',
            expectedOutput: 'Hello, Python World!',
            description: 'Should print the exact greeting message'
          }
        ],
        hints: [
          'Use the print() function',
          'Put your text in quotes: "text here"',
          'Don\'t forget the exclamation mark!'
        ],
        gamificationPoints: 50,
        order: 1
      },
      {
        title: 'Variables Challenge',
        description: 'Create and use variables to store your information.',
        difficulty: 'easy',
        objectives: [
          'Create variables with different data types',
          'Use variables in print statements',
          'Understand string concatenation'
        ],
        instructions: 'Create variables for your name and age, then print a message: "My name is [name] and I am [age] years old."',
        initialCode: '# Create your variables here\nname = \nage = \n\n# Print your message\n',
        expectedOutput: 'My name is Alex and I am 10 years old.',
        testCases: [
          {
            input: 'name = "Alex"\\nage = 10',
            expectedOutput: 'My name is Alex and I am 10 years old.',
            description: 'Should print a personalized message with name and age'
          }
        ],
        hints: [
          'Store text in quotes: name = "Your Name"',
          'Numbers don\'t need quotes: age = 10',
          'Use str(age) to convert number to string when printing'
        ],
        gamificationPoints: 75,
        order: 2
      },
      {
        title: 'Conditional Logic',
        description: 'Write a program that makes decisions based on conditions.',
        difficulty: 'medium',
        objectives: [
          'Use if statements',
          'Compare values with comparison operators',
          'Create branching logic'
        ],
        instructions: 'Create a program that checks if a number is positive, negative, or zero, and prints the appropriate message.',
        initialCode: 'number = 5\n\n# Write your if-elif-else statements here\n',
        expectedOutput: 'The number is positive.',
        testCases: [
          {
            input: 'number = 5',
            expectedOutput: 'The number is positive.',
            description: 'Positive number test'
          },
          {
            input: 'number = -3',
            expectedOutput: 'The number is negative.',
            description: 'Negative number test'
          },
          {
            input: 'number = 0',
            expectedOutput: 'The number is zero.',
            description: 'Zero test'
          }
        ],
        hints: [
          'Use if, elif, and else',
          'Use > 0 to check positive',
          'Use < 0 to check negative',
          'Use == 0 to check zero'
        ],
        gamificationPoints: 100,
        order: 3
      },
      {
        title: 'Loop Master',
        description: 'Use loops to repeat actions efficiently.',
        difficulty: 'medium',
        objectives: [
          'Create for loops',
          'Use the range() function',
          'Print multiple lines with a loop'
        ],
        instructions: 'Write a program that prints numbers from 1 to 10 using a for loop.',
        initialCode: '# Write your loop here\n',
        expectedOutput: '1\\n2\\n3\\n4\\n5\\n6\\n7\\n8\\n9\\n10',
        testCases: [
          {
            input: '',
            expectedOutput: '1\\n2\\n3\\n4\\n5\\n6\\n7\\n8\\n9\\n10',
            description: 'Should print numbers 1 through 10'
          }
        ],
        hints: [
          'Use for i in range()',
          'range(1, 11) gives numbers 1 to 10',
          'Print each number in the loop'
        ],
        gamificationPoints: 100,
        order: 4
      },
      {
        title: 'Function Creator',
        description: 'Build a function that performs a calculation.',
        difficulty: 'hard',
        objectives: [
          'Define a function with parameters',
          'Return a value from a function',
          'Call the function with different arguments'
        ],
        instructions: 'Create a function called calculate_area that takes length and width as parameters and returns the area of a rectangle.',
        initialCode: '# Define your function here\n\n\n# Test your function\nprint(calculate_area(5, 3))\nprint(calculate_area(10, 2))',
        expectedOutput: '15\\n20',
        testCases: [
          {
            input: 'calculate_area(5, 3)',
            expectedOutput: '15',
            description: 'Calculate area: 5 × 3'
          },
          {
            input: 'calculate_area(10, 2)',
            expectedOutput: '20',
            description: 'Calculate area: 10 × 2'
          }
        ],
        hints: [
          'def calculate_area(length, width):',
          'Area = length * width',
          'Use return to send back the result'
        ],
        gamificationPoints: 150,
        order: 5
      }
    ]
  },
  // HTML/CSS Challenges
  {
    courseTitle: 'HTML & CSS Basics',
    challenges: [
      {
        title: 'Create Your First Webpage',
        description: 'Build a simple HTML page with basic structure.',
        difficulty: 'easy',
        objectives: [
          'Create valid HTML structure',
          'Use heading and paragraph tags',
          'Add a page title'
        ],
        instructions: 'Create an HTML page with a title, heading, and paragraph about yourself.',
        initialCode: '<!DOCTYPE html>\n<html>\n<head>\n  <!-- Add title here -->\n</head>\n<body>\n  <!-- Add your content here -->\n</body>\n</html>',
        expectedOutput: 'Valid HTML page with heading and paragraph',
        testCases: [
          {
            input: '',
            expectedOutput: 'Page contains h1 tag and p tag',
            description: 'Should have proper HTML structure'
          }
        ],
        hints: [
          'Use <title> in the head section',
          'Use <h1> for your main heading',
          'Use <p> for your paragraph'
        ],
        gamificationPoints: 50,
        isProgrammingChallenge: true,
        order: 1
      },
      {
        title: 'Lists and Links',
        description: 'Create lists and add links to your page.',
        difficulty: 'easy',
        objectives: [
          'Create unordered and ordered lists',
          'Add hyperlinks',
          'Use proper HTML syntax'
        ],
        instructions: 'Create a page with your top 3 favorite hobbies in an ordered list and 3 useful website links in an unordered list.',
        initialCode: '<!-- Write your HTML here -->\n',
        expectedOutput: 'Page with ordered list and unordered list with links',
        testCases: [
          {
            input: '',
            expectedOutput: 'Contains ol, ul, and a tags',
            description: 'Should have both list types and links'
          }
        ],
        hints: [
          '<ol> for ordered list, <ul> for unordered',
          '<li> for each list item',
          '<a href="url">link text</a> for links'
        ],
        gamificationPoints: 75,
        isProgrammingChallenge: true,
        order: 2
      },
      {
        title: 'Style with CSS',
        description: 'Add colors and fonts to your webpage.',
        difficulty: 'medium',
        objectives: [
          'Link external CSS file',
          'Style headings and paragraphs',
          'Use colors and fonts'
        ],
        instructions: 'Create a CSS file that makes your h1 blue, centers it, and makes paragraphs gray with a larger font.',
        initialCode: '/* styles.css */\n\n/* Style your h1 here */\n\n\n/* Style your paragraphs here */\n',
        expectedOutput: 'CSS with h1 and p styling',
        testCases: [
          {
            input: '',
            expectedOutput: 'h1 with color, text-align; p with color, font-size',
            description: 'Should have proper CSS rules'
          }
        ],
        hints: [
          'h1 { property: value; }',
          'Use color: blue;',
          'Use text-align: center;',
          'Use font-size: 18px;'
        ],
        gamificationPoints: 100,
        isProgrammingChallenge: true,
        order: 3
      },
      {
        title: 'Colorful Card',
        description: 'Design a card component with CSS.',
        difficulty: 'medium',
        objectives: [
          'Use div containers',
          'Apply padding and margins',
          'Add borders and shadows',
          'Use background colors'
        ],
        instructions: 'Create a card with a title, text, and styled with padding, border-radius, and a box-shadow.',
        initialCode: '/* CSS */\n.card {\n  /* Add your styles here */\n}\n\n<!-- HTML -->\n<div class="card">\n  <h2>Card Title</h2>\n  <p>Card content goes here.</p>\n</div>',
        expectedOutput: 'Styled card component',
        testCases: [
          {
            input: '',
            expectedOutput: 'Card with padding, border-radius, box-shadow',
            description: 'Should create a visually appealing card'
          }
        ],
        hints: [
          'padding: 20px; adds space inside',
          'border-radius: 10px; rounds corners',
          'box-shadow: 0 4px 6px rgba(0,0,0,0.1); adds shadow',
          'background-color: white; sets background'
        ],
        gamificationPoints: 125,
        isProgrammingChallenge: true,
        order: 4
      },
      {
        title: 'Flexbox Layout',
        description: 'Create a responsive layout using Flexbox.',
        difficulty: 'hard',
        objectives: [
          'Use display: flex',
          'Align items with Flexbox properties',
          'Create a multi-column layout'
        ],
        instructions: 'Create a header with navigation items arranged horizontally using Flexbox, and center them.',
        initialCode: '/* CSS */\n.header {\n  /* Add Flexbox styles here */\n}\n\n<!-- HTML -->\n<div class="header">\n  <div>Home</div>\n  <div>About</div>\n  <div>Contact</div>\n</div>',
        expectedOutput: 'Horizontal flexbox layout',
        testCases: [
          {
            input: '',
            expectedOutput: 'display: flex with centered items',
            description: 'Should use Flexbox for layout'
          }
        ],
        hints: [
          'display: flex; enables Flexbox',
          'justify-content: center; centers horizontally',
          'align-items: center; centers vertically',
          'gap: 20px; adds space between items'
        ],
        gamificationPoints: 150,
        isProgrammingChallenge: true,
        order: 5
      }
    ]
  },
  // JavaScript Challenges
  {
    courseTitle: 'JavaScript Fun Basics',
    challenges: [
      {
        title: 'Console Greeting',
        description: 'Write JavaScript to display a greeting in the console.',
        difficulty: 'easy',
        objectives: [
          'Use console.log()',
          'Create a variable',
          'Concatenate strings'
        ],
        instructions: 'Create a variable with your name and log a greeting message to the console.',
        initialCode: '// Write your JavaScript here\n',
        expectedOutput: 'Hello, my name is Alex!',
        testCases: [
          {
            input: 'let name = "Alex";',
            expectedOutput: 'Hello, my name is Alex!',
            description: 'Should log greeting with name'
          }
        ],
        hints: [
          'Use let to create a variable',
          'Use console.log() to display messages',
          'Concatenate with + or use template literals'
        ],
        gamificationPoints: 50,
        isProgrammingChallenge: true,
        order: 1
      },
      {
        title: 'Simple Calculator',
        description: 'Create a function that performs basic math operations.',
        difficulty: 'easy',
        objectives: [
          'Define a function',
          'Use parameters',
          'Return a value'
        ],
        instructions: 'Create a function called add that takes two numbers and returns their sum.',
        initialCode: '// Define your function here\n\n\n// Test your function\nconsole.log(add(5, 3));  // Should output 8\nconsole.log(add(10, 20)); // Should output 30',
        expectedOutput: '8\\n30',
        testCases: [
          {
            input: 'add(5, 3)',
            expectedOutput: '8',
            description: 'Add 5 + 3'
          },
          {
            input: 'add(10, 20)',
            expectedOutput: '30',
            description: 'Add 10 + 20'
          }
        ],
        hints: [
          'function add(a, b) { }',
          'return a + b;',
          'Call the function with console.log()'
        ],
        gamificationPoints: 75,
        isProgrammingChallenge: true,
        order: 2
      },
      {
        title: 'Button Click Counter',
        description: 'Create an interactive counter that increases when a button is clicked.',
        difficulty: 'medium',
        objectives: [
          'Select DOM elements',
          'Add event listeners',
          'Update element content'
        ],
        instructions: 'Create HTML with a button and a display. When clicked, increment a counter and show the count.',
        initialCode: '<!-- HTML -->\n<div id="display">0</div>\n<button id="btn">Click Me!</button>\n\n<script>\n// Write your JavaScript here\n\n</script>',
        expectedOutput: 'Working counter that increments',
        testCases: [
          {
            input: 'button click',
            expectedOutput: 'Counter increments',
            description: 'Counter should increase on each click'
          }
        ],
        hints: [
          'document.getElementById() to select elements',
          'addEventListener("click", function)',
          'Use textContent to update display'
        ],
        gamificationPoints: 100,
        isProgrammingChallenge: true,
        order: 3
      },
      {
        title: 'Color Changer',
        description: 'Build a page that changes background color on button click.',
        difficulty: 'medium',
        objectives: [
          'Manipulate CSS with JavaScript',
          'Use Math.random()',
          'Work with arrays'
        ],
        instructions: 'Create a button that changes the page background to a random color from an array of colors.',
        initialCode: '<button id="colorBtn">Change Color</button>\n\n<script>\nlet colors = ["red", "blue", "green", "yellow", "purple"];\n\n// Write your code here\n\n</script>',
        expectedOutput: 'Button that changes background color',
        testCases: [
          {
            input: 'button click',
            expectedOutput: 'Background color changes',
            description: 'Should randomly change background color'
          }
        ],
        hints: [
          'Math.random() * colors.length',
          'Math.floor() to get whole number',
          'document.body.style.backgroundColor = color;'
        ],
        gamificationPoints: 125,
        isProgrammingChallenge: true,
        order: 4
      },
      {
        title: 'Interactive Quiz',
        description: 'Create a simple quiz with instant feedback.',
        difficulty: 'hard',
        objectives: [
          'Handle form submissions',
          'Validate user input',
          'Display dynamic feedback',
          'Use conditionals'
        ],
        instructions: 'Create a quiz with a question, input field, and submit button. Check if the answer is correct and display feedback.',
        initialCode: '<!-- HTML -->\n<h3>What is 5 + 3?</h3>\n<input type="text" id="answer">\n<button id="submit">Submit</button>\n<div id="feedback"></div>\n\n<script>\n// Write your JavaScript here\n\n</script>',
        expectedOutput: 'Quiz with answer validation',
        testCases: [
          {
            input: 'answer: 8',
            expectedOutput: 'Correct!',
            description: 'Should show success for correct answer'
          },
          {
            input: 'answer: 5',
            expectedOutput: 'Try again!',
            description: 'Should show error for incorrect answer'
          }
        ],
        hints: [
          'Get input value with .value',
          'Convert to number with parseInt() or Number()',
          'Compare with === for exact match',
          'Update feedback div with textContent'
        ],
        gamificationPoints: 150,
        isProgrammingChallenge: true,
        order: 5
      }
    ]
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // Connect to database
    await connectDB();

    // Find or create a teacher user for instructor reference
    let teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('teacher123', salt);
      
      teacher = new User({
        username: 'demoteacher',
        firstName: 'Demo',
        lastName: 'Teacher',
        email: 'teacher@example.com',
        password: hashedPassword,
        role: 'teacher'
      });
      await teacher.save();
      console.log('✓ Created demo teacher user');
    }

    // Clear existing courses and challenges
    await Course.deleteMany({});
    await Challenge.deleteMany({});
    console.log('✓ Cleared existing courses and challenges');

    // Create courses with lessons
    const createdCourses = [];
    for (const courseData of coursesData) {
      const course = new Course({
        ...courseData,
        instructor: teacher._id
      });
      await course.save();
      createdCourses.push(course);
      console.log(`✓ Created course: ${course.title}`);
    }

    // Create challenges for each course
    for (const challengeSet of challengesData) {
      const course = createdCourses.find(c => c.title === challengeSet.courseTitle);
      if (!course) {
        console.log(`⚠ Course not found: ${challengeSet.courseTitle}`);
        continue;
      }

      const challengeIds = [];
      for (const challengeData of challengeSet.challenges) {
        const challenge = new Challenge({
          ...challengeData,
          course: course._id,
          createdBy: teacher._id
        });
        await challenge.save();
        challengeIds.push(challenge._id);
        console.log(`  ✓ Created challenge: ${challenge.title}`);
      }

      // Update course with challenge references
      course.challenges = challengeIds;
      await course.save();
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - ${createdCourses.length} courses created`);
    console.log(`   - ${challengesData.reduce((sum, set) => sum + set.challenges.length, 0)} challenges created`);
    console.log(`\n👤 Demo Teacher Account:`);
    console.log(`   Email: teacher@example.com`);
    console.log(`   Password: teacher123`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
