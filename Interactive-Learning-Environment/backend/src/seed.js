require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Challenge = require('./models/Challenge');
const Badge = require('./models/Badge');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Progress = require('./models/Progress');

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/interactive-learning-env';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Challenge.deleteMany({});
    await Badge.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Progress.deleteMany({});
    console.log('Old data cleared');

    const now = Date.now();
    const daysAgo = (value) => new Date(now - value * 24 * 60 * 60 * 1000);
    const daysFromNow = (value) => new Date(now + value * 24 * 60 * 60 * 1000);

    // Create teachers
    console.log('Creating teachers...');
    const teacher1 = await User.create({
      username: 'mr_smith',
      email: 'smith@school.edu',
      password: 'password123',
      firstName: 'John',
      lastName: 'Smith',
      role: 'teacher',
      school: 'Tech Academy',
      bio: 'Passionate about teaching programming'
    });

    const teacher2 = await User.create({
      username: 'ms_johnson',
      email: 'johnson@school.edu',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'teacher',
      school: 'Tech Academy',
      bio: 'Specializes in Web Development'
    });

    const admin = await User.create({
      username: 'admin_master',
      email: 'admin@school.edu',
      password: 'password123',
      firstName: 'System',
      lastName: 'Admin',
      role: 'admin',
      school: 'Tech Academy',
      bio: 'Full platform access for demos and moderation'
    });
    console.log('Teachers created');

    // Create students
    console.log('Creating students...');
    const student1 = await User.create({
      username: 'alex_coder',
      email: 'alex@student.edu',
      password: 'password123',
      firstName: 'Alex',
      lastName: 'Rodriguez',
      role: 'student',
      grade: 9,
      school: 'Tech Academy',
      bio: 'Love coding and learning new things'
    });

    const student2 = await User.create({
      username: 'emma_dev',
      email: 'emma@student.edu',
      password: 'password123',
      firstName: 'Emma',
      lastName: 'Wilson',
      role: 'student',
      grade: 10,
      school: 'Tech Academy',
      bio: 'Interested in web development'
    });

    const student3 = await User.create({
      username: 'jordan_learns',
      email: 'jordan@student.edu',
      password: 'password123',
      firstName: 'Jordan',
      lastName: 'Martinez',
      role: 'student',
      grade: 8,
      school: 'Tech Academy',
      bio: 'Beginner programmer'
    });
    console.log('Students created');

    // Create courses
    console.log('Creating courses...');
    const course1 = await Course.create({
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript programming including variables, functions, and control flow.',
      instructor: teacher1._id,
      targetGrades: [8, 9, 10],
      difficulty: 'beginner',
      topics: ['variables', 'functions', 'loops', 'conditionals'],
      isPublished: true,
      enrolledStudents: [student1._id, student2._id, student3._id]
    });

    const course2 = await Course.create({
      title: 'Web Development with React',
      description: 'Build modern web applications using React.js and state management.',
      instructor: teacher2._id,
      targetGrades: [9, 10, 11],
      difficulty: 'intermediate',
      topics: ['React', 'JSX', 'Components', 'State', 'Props'],
      isPublished: true,
      enrolledStudents: [student1._id, student2._id]
    });

    const course3 = await Course.create({
      title: 'Data Structures and Algorithms',
      description: 'Master essential data structures and algorithmic problem-solving techniques.',
      instructor: teacher1._id,
      targetGrades: [10, 11, 12],
      difficulty: 'advanced',
      topics: ['arrays', 'linked lists', 'sorting', 'searching', 'graphs'],
      isPublished: true,
      enrolledStudents: [student1._id]
    });

    const course4 = await Course.create({
      title: 'Python Problem Solving',
      description: 'Build confidence with Python through practical problem-solving challenges.',
      instructor: teacher2._id,
      targetGrades: [7, 8, 9],
      difficulty: 'beginner',
      topics: ['variables', 'conditionals', 'loops', 'functions'],
      isPublished: true,
      enrolledStudents: [student2._id, student3._id]
    });

    const course5 = await Course.create({
      title: 'Algorithmic Thinking with Games',
      description: 'Learn algorithm design by solving logic and game-inspired challenges.',
      instructor: teacher1._id,
      targetGrades: [9, 10, 11],
      difficulty: 'intermediate',
      topics: ['greedy', 'dynamic programming', 'graphs', 'optimization'],
      isPublished: true,
      enrolledStudents: [student1._id, student2._id]
    });

    const course6 = await Course.create({
      title: 'Node.js and API Engineering',
      description: 'Design and build robust REST APIs with Node.js, Express, and MongoDB.',
      instructor: teacher2._id,
      targetGrades: [10, 11, 12],
      difficulty: 'advanced',
      topics: ['express', 'routing', 'middleware', 'api-design', 'mongodb'],
      isPublished: true,
      enrolledStudents: [student1._id]
    });

    teacher1.teachingCourses = [course1._id, course3._id, course5._id];
    teacher2.teachingCourses = [course2._id, course4._id, course6._id];
    await teacher1.save();
    await teacher2.save();

    student1.enrolledCourses = [course1._id, course2._id, course3._id, course5._id, course6._id];
    student2.enrolledCourses = [course1._id, course2._id, course4._id, course5._id];
    student3.enrolledCourses = [course1._id, course4._id];
    await student1.save();
    await student2.save();
    await student3.save();

    console.log('Courses created');

    // Create challenges for JavaScript Fundamentals
    console.log('Creating challenges...');
    const challenge1 = await Challenge.create({
      title: 'Hello World',
      description: 'Write a program that prints "Hello, World!" to the console.',
      course: course1._id,
      difficulty: 'easy',
      objectives: ['Understanding console output', 'Basic syntax'],
      instructions: 'Create a simple program that prints "Hello, World!" to the console.',
      initialCode: '// Create a Print block to output text',
      expectedOutput: 'Hello, World!',
      testCases: [
        {
          input: '',
          expectedOutput: 'Hello, World!',
          description: 'Basic output test'
        }
      ],
      hints: ['Use the Print block', 'The output should exactly match "Hello, World!"'],
      gamificationPoints: 50,
      isBlockBased: true,
      blocklyXml: '<xml><block type="log"><field name="value">Hello, World!</field></block></xml>',
      order: 1,
      createdBy: teacher1._id
    });

    const challenge2 = await Challenge.create({
      title: 'Sum Two Numbers',
      description: 'Create a function that takes two numbers and returns their sum.',
      course: course1._id,
      difficulty: 'easy',
      objectives: ['Function creation', 'Basic arithmetic', 'Return statements'],
      instructions: 'Create a function called "add" that takes two parameters and returns their sum.',
      initialCode: '// Create a function named "add" with two parameters\n// Add an Add block to combine them\n// Return the result',
      expectedOutput: '8',
      testCases: [
        {
          input: 'add(5, 3)',
          expectedOutput: '8',
          description: 'Test with positive numbers'
        },
        {
          input: 'add(-5, 3)',
          expectedOutput: '-2',
          description: 'Test with negative numbers'
        }
      ],
      hints: ['Use the Function block to define "add"', 'Use the Add block to combine the parameters', 'Return the result'],
      gamificationPoints: 75,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 2,
      createdBy: teacher1._id
    });

    const challenge3 = await Challenge.create({
      title: 'Find the Maximum',
      description: 'Write a function that finds the maximum value in an array.',
      course: course1._id,
      difficulty: 'medium',
      objectives: ['Array iteration', 'Conditional logic', 'Function design'],
      instructions: 'Create a function called "findMax" that takes an array and returns the largest number.',
      initialCode: '// Create a function named "findMax"\n// Initialize a max variable with the first element\n// Loop through the array\n// Use If to compare values\n// Return the maximum',
      expectedOutput: '9',
      testCases: [
        {
          input: 'findMax([1, 5, 3, 9, 2])',
          expectedOutput: '9',
          description: 'Test with mixed numbers'
        },
        {
          input: 'findMax([10, 10, 10])',
          expectedOutput: '10',
          description: 'Test with duplicate values'
        }
      ],
      hints: ['Use a For Loop to iterate through the array', 'Use If Statement to compare values', 'Keep track of the maximum value'],
      gamificationPoints: 100,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 3,
      createdBy: teacher1._id
    });

    // Create challenges for React course
    const challenge4 = await Challenge.create({
      title: 'Build a Counter Component',
      description: 'Create a React component that displays a counter with increment and decrement buttons.',
      course: course2._id,
      difficulty: 'medium',
      objectives: ['State management', 'Event handling', 'Component structure'],
      instructions: 'Build a Counter component with increment/decrement buttons and a running count.',
      initialCode: '// Create a function component named Counter\n// Add a State block for count (initialize to 0)\n// Add button blocks for increment and decrement',
      expectedOutput: 'A working counter component',
      testCases: [],
      hints: ['Use the Function block for the component', 'Add two button blocks with click handlers', 'Update state on button click'],
      gamificationPoints: 150,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 1,
      createdBy: teacher2._id
    });

    const challenge5 = await Challenge.create({
      title: 'Reusable Card Component',
      description: 'Build a reusable React Card component with props for title, content, and footer.',
      course: course2._id,
      difficulty: 'medium',
      objectives: ['Component props', 'Reusable UI patterns', 'Composition'],
      instructions: 'Create a Card component that can render dynamic title/content/footer props.',
      initialCode: '// Build a Card component that accepts props and renders children',
      expectedOutput: 'A reusable card component',
      testCases: [],
      hints: ['Pass props into JSX', 'Use children for flexible content'],
      gamificationPoints: 120,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 2,
      createdBy: teacher2._id
    });

    const challenge6 = await Challenge.create({
      title: 'State-Driven Todo List',
      description: 'Implement a simple todo list using React state and list rendering.',
      course: course2._id,
      difficulty: 'hard',
      objectives: ['State arrays', 'List rendering', 'Event handling'],
      instructions: 'Create a todo list with add and remove functionality.',
      initialCode: '// Use state to store todos and render them with map()',
      expectedOutput: 'A working todo list',
      testCases: [],
      hints: ['Use useState for list data', 'Use filter to remove items'],
      gamificationPoints: 170,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 3,
      createdBy: teacher2._id
    });

    const challenge7 = await Challenge.create({
      title: 'Binary Search Drill',
      description: 'Implement binary search to locate a target value in a sorted array.',
      course: course3._id,
      difficulty: 'medium',
      objectives: ['Search algorithms', 'Loop invariants', 'Complexity thinking'],
      instructions: 'Write a function binarySearch(arr, target) returning the index or -1.',
      initialCode: 'function binarySearch(arr, target) {\n  // your code\n}',
      expectedOutput: '2',
      testCases: [
        { input: 'binarySearch([1,3,5,7], 5)', expectedOutput: '2', description: 'find existing value' },
        { input: 'binarySearch([1,3,5,7], 6)', expectedOutput: '-1', description: 'missing value' }
      ],
      hints: ['Track left/right pointers', 'Move mid intelligently'],
      gamificationPoints: 130,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 1,
      createdBy: teacher1._id
    });

    const challenge8 = await Challenge.create({
      title: 'Queue with Two Stacks',
      description: 'Design a queue data structure using two stacks.',
      course: course3._id,
      difficulty: 'hard',
      objectives: ['Data structure composition', 'Amortized reasoning'],
      instructions: 'Implement enqueue and dequeue with two arrays representing stacks.',
      initialCode: '// Implement a queue using two stacks',
      expectedOutput: 'FIFO behavior',
      testCases: [],
      hints: ['Use one stack for incoming, one for outgoing'],
      gamificationPoints: 190,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 2,
      createdBy: teacher1._id
    });

    const challenge9 = await Challenge.create({
      title: 'FizzBuzz in Python',
      description: 'Solve classic FizzBuzz with clean loop logic.',
      course: course4._id,
      difficulty: 'easy',
      objectives: ['Modulo logic', 'Looping', 'Output formatting'],
      instructions: 'Print numbers 1-30 with Fizz/Buzz replacements.',
      initialCode: '# write your fizzbuzz solution here',
      expectedOutput: 'FizzBuzz sequence',
      testCases: [],
      hints: ['Check divisibility by 3 and 5 first'],
      gamificationPoints: 60,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 1,
      createdBy: teacher2._id
    });

    const challenge10 = await Challenge.create({
      title: 'Palindrome Checker',
      description: 'Build a function to test whether a word is a palindrome.',
      course: course4._id,
      difficulty: 'medium',
      objectives: ['String manipulation', 'Function structure'],
      instructions: 'Return true if text reads the same forwards and backwards.',
      initialCode: 'def is_palindrome(text):\n    # your code\n    pass',
      expectedOutput: 'true',
      testCases: [
        { input: 'is_palindrome("level")', expectedOutput: 'true', description: 'palindrome case' },
        { input: 'is_palindrome("hello")', expectedOutput: 'false', description: 'non-palindrome case' }
      ],
      hints: ['Normalize case first', 'Compare against reversed text'],
      gamificationPoints: 95,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 2,
      createdBy: teacher2._id
    });

    const challenge11 = await Challenge.create({
      title: 'Shortest Path Basics',
      description: 'Compute shortest path distance in a weighted graph (small input).',
      course: course5._id,
      difficulty: 'hard',
      objectives: ['Graph modeling', 'Priority queue intuition'],
      instructions: 'Implement a shortest path function for a small graph representation.',
      initialCode: '// implement shortestPath(graph, start, target)',
      expectedOutput: 'minimum distance',
      testCases: [],
      hints: ['Track best distances as you explore nodes'],
      gamificationPoints: 200,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 1,
      createdBy: teacher1._id
    });

    const challenge12 = await Challenge.create({
      title: 'Coin Change Strategy',
      description: 'Find the minimum number of coins needed to form a value.',
      course: course5._id,
      difficulty: 'hard',
      objectives: ['Dynamic programming', 'Subproblem design'],
      instructions: 'Write minCoins(coins, amount) returning the minimum coins or -1.',
      initialCode: 'function minCoins(coins, amount) {\n  // your code\n}',
      expectedOutput: '2',
      testCases: [
        { input: 'minCoins([1,2,5], 11)', expectedOutput: '3', description: 'basic case' },
        { input: 'minCoins([2], 3)', expectedOutput: '-1', description: 'impossible case' }
      ],
      hints: ['Build solutions from smaller amounts'],
      gamificationPoints: 210,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 2,
      createdBy: teacher1._id
    });

    const challenge13 = await Challenge.create({
      title: 'REST Endpoint Builder',
      description: 'Create an Express route with validation and proper status codes.',
      course: course6._id,
      difficulty: 'medium',
      objectives: ['REST conventions', 'Input validation', 'Response handling'],
      instructions: 'Implement POST /api/items with validation and JSON response.',
      initialCode: '// create express route for POST /api/items',
      expectedOutput: '201 for valid payload',
      testCases: [],
      hints: ['Validate required fields before saving'],
      gamificationPoints: 140,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 1,
      createdBy: teacher2._id
    });

    const challenge14 = await Challenge.create({
      title: 'Auth Middleware Guard',
      description: 'Implement JWT middleware to protect private endpoints.',
      course: course6._id,
      difficulty: 'hard',
      objectives: ['Middleware patterns', 'Token verification', 'Error responses'],
      instructions: 'Write middleware that verifies JWT and sets req.user.',
      initialCode: '// write auth middleware(req, res, next)',
      expectedOutput: 'authorized requests pass',
      testCases: [],
      hints: ['Return 401 when token is missing/invalid'],
      gamificationPoints: 180,
      isBlockBased: true,
      blocklyXml: '<xml></xml>',
      order: 2,
      createdBy: teacher2._id
    });

    // Update courses to include challenges
    course1.challenges = [challenge1._id, challenge2._id, challenge3._id];
    course2.challenges = [challenge4._id, challenge5._id, challenge6._id];
    course3.challenges = [challenge7._id, challenge8._id];
    course4.challenges = [challenge9._id, challenge10._id];
    course5.challenges = [challenge11._id, challenge12._id];
    course6.challenges = [challenge13._id, challenge14._id];
    await course1.save();
    await course2.save();
    await course3.save();
    await course4.save();
    await course5.save();
    await course6.save();
    console.log('Challenges created');

    // Create badges
    console.log('Creating badges...');
    const badge1 = await Badge.create({
      name: 'First Steps',
      description: 'Completed your first challenge',
      icon: 'first-steps',
      category: 'completion',
      requiredChallenges: 1
    });

    const badge2 = await Badge.create({
      name: 'Challenge Master',
      description: 'Completed 10 challenges',
      icon: 'challenge-master',
      category: 'mastery',
      requiredChallenges: 10
    });

    const badge3 = await Badge.create({
      name: 'Perfect Score',
      description: 'Got 100% on a challenge',
      icon: 'perfect-score',
      category: 'special',
      requiredPoints: 100
    });
    console.log('Badges created');

    console.log('Creating assignments...');
    const assignment1 = await Assignment.create({
      title: 'Week 1 JavaScript Basics',
      description: 'Complete the first two JavaScript fundamentals challenges.',
      course: course1._id,
      challenge: challenge2._id,
      teacher: teacher1._id,
      assignedTo: [student1._id, student2._id, student3._id],
      dueDate: daysFromNow(7),
      isPublished: true
    });

    const assignment2 = await Assignment.create({
      title: 'Python Logic Practice',
      description: 'Finish palindrome challenge and explain your approach in comments.',
      course: course4._id,
      challenge: challenge10._id,
      teacher: teacher2._id,
      assignedTo: [student2._id, student3._id],
      dueDate: daysFromNow(5),
      isPublished: true
    });
    console.log('Assignments created');

    console.log('Creating submissions...');
    await Submission.create([
      {
        student: student1._id,
        challenge: challenge1._id,
        assignment: assignment1._id,
        course: course1._id,
        code: 'console.log("Hello, World!");',
        language: 'javascript',
        result: 'passed',
        testsPassed: 1,
        totalTests: 1,
        feedback: 'Great start. Output matches expected result.',
        executionTime: 8,
        pointsEarned: 50,
        timeSpent: 120,
        attempts: 1,
        isFirstAttempt: true,
        submittedAt: daysAgo(6),
        completedAt: daysAgo(6)
      },
      {
        student: student2._id,
        challenge: challenge2._id,
        assignment: assignment1._id,
        course: course1._id,
        code: 'function add(a, b) { return a + b; }\nconsole.log(add(5, 3));',
        language: 'javascript',
        result: 'passed',
        testsPassed: 2,
        totalTests: 2,
        feedback: 'Good use of function and return statement.',
        executionTime: 12,
        pointsEarned: 75,
        timeSpent: 260,
        attempts: 2,
        isFirstAttempt: false,
        submittedAt: daysAgo(3),
        completedAt: daysAgo(3)
      },
      {
        student: student3._id,
        challenge: challenge10._id,
        assignment: assignment2._id,
        course: course4._id,
        code: 'def is_palindrome(text):\n    cleaned = text.lower()\n    return cleaned == cleaned[::-1]\n\nprint(is_palindrome("level"))',
        language: 'python',
        result: 'failed',
        testsPassed: 1,
        totalTests: 2,
        feedback: 'Logic is close. Check expected output formatting for boolean values.',
        executionTime: 18,
        pointsEarned: 35,
        timeSpent: 340,
        attempts: 3,
        isFirstAttempt: false,
        submittedAt: daysAgo(1),
        completedAt: daysAgo(1)
      }
    ]);
    console.log('Submissions created');

    console.log('Creating progress snapshots...');
    await Progress.create([
      {
        student: student1._id,
        course: course1._id,
        completedChallenges: [
          {
            challenge: challenge1._id,
            completedAt: daysAgo(6),
            pointsEarned: 50
          }
        ],
        totalPoints: 50,
        currentLevel: 2,
        experiencePoints: 120,
        badges: [
          {
            name: badge1.name,
            description: badge1.description,
            earnedAt: daysAgo(6)
          }
        ],
        achievements: ['Completed first challenge'],
        averageScore: 100,
        learningPath: 'mixed',
        adaptiveRecommendations: [
          {
            challengeId: challenge2._id,
            reason: 'Ready for function-based challenge progression',
            suggestedAt: daysAgo(2)
          }
        ],
        lastActivityAt: daysAgo(1),
        estimatedTimeToCompletion: 4
      },
      {
        student: student2._id,
        course: course1._id,
        completedChallenges: [
          {
            challenge: challenge2._id,
            completedAt: daysAgo(3),
            pointsEarned: 75
          }
        ],
        totalPoints: 75,
        currentLevel: 2,
        experiencePoints: 180,
        badges: [],
        achievements: ['Improved after retries'],
        averageScore: 90,
        learningPath: 'text-based',
        adaptiveRecommendations: [
          {
            challengeId: challenge3._id,
            reason: 'Practice loops and conditionals to strengthen fundamentals',
            suggestedAt: daysAgo(1)
          }
        ],
        lastActivityAt: daysAgo(1),
        estimatedTimeToCompletion: 6
      },
      {
        student: student3._id,
        course: course4._id,
        completedChallenges: [],
        totalPoints: 35,
        currentLevel: 1,
        experiencePoints: 90,
        badges: [],
        achievements: ['Submitted first Python solution'],
        averageScore: 55,
        learningPath: 'visual',
        adaptiveRecommendations: [
          {
            challengeId: challenge9._id,
            reason: 'Reinforce loop and modulo foundations before advanced string tasks',
            suggestedAt: daysAgo(1)
          }
        ],
        lastActivityAt: daysAgo(1),
        estimatedTimeToCompletion: 8
      }
    ]);
    console.log('Progress snapshots created');

    console.log('\nDatabase seeded successfully!');
    console.log('\nSample Credentials:');
    console.log('   Teachers:');
    console.log('   - Username: mr_smith / Password: password123');
    console.log('   - Username: ms_johnson / Password: password123');
    console.log('   Admin:');
    console.log('   - Username: admin_master / Password: password123');
    console.log('   Students:');
    console.log('   - Username: alex_coder / Password: password123');
    console.log('   - Username: emma_dev / Password: password123');
    console.log('   - Username: jordan_learns / Password: password123');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
