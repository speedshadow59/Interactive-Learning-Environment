require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Challenge = require('./models/Challenge');
const Badge = require('./models/Badge');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/interactive-learning-env';
    console.log(`📦 Connecting to MongoDB at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Challenge.deleteMany({});
    await Badge.deleteMany({});
    console.log('✅ Old data cleared');

    // Create teachers
    console.log('👨‍🏫 Creating teachers...');
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
    console.log('✅ Teachers created');

    // Create students
    console.log('👨‍🎓 Creating students...');
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
    console.log('✅ Students created');

    // Create courses
    console.log('📚 Creating courses...');
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

    teacher1.teachingCourses = [course1._id, course3._id];
    teacher2.teachingCourses = [course2._id];
    await teacher1.save();
    await teacher2.save();

    student1.enrolledCourses = [course1._id, course2._id, course3._id];
    student2.enrolledCourses = [course1._id, course2._id];
    student3.enrolledCourses = [course1._id];
    await student1.save();
    await student2.save();
    await student3.save();

    console.log('✅ Courses created');

    // Create challenges for JavaScript Fundamentals
    console.log('🎯 Creating challenges...');
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

    // Update courses to include challenges
    course1.challenges = [challenge1._id, challenge2._id, challenge3._id];
    course2.challenges = [challenge4._id];
    await course1.save();
    await course2.save();
    console.log('✅ Challenges created');

    // Create badges
    console.log('🏆 Creating badges...');
    const badge1 = await Badge.create({
      name: 'First Steps',
      description: 'Completed your first challenge',
      icon: '👶',
      category: 'completion',
      requiredChallenges: 1
    });

    const badge2 = await Badge.create({
      name: 'Challenge Master',
      description: 'Completed 10 challenges',
      icon: '⭐',
      category: 'mastery',
      requiredChallenges: 10
    });

    const badge3 = await Badge.create({
      name: 'Perfect Score',
      description: 'Got 100% on a challenge',
      icon: '🎯',
      category: 'special',
      requiredPoints: 100
    });
    console.log('✅ Badges created');

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📝 Sample Credentials:');
    console.log('   Teachers:');
    console.log('   - Username: mr_smith / Password: password123');
    console.log('   - Username: ms_johnson / Password: password123');
    console.log('   Students:');
    console.log('   - Username: alex_coder / Password: password123');
    console.log('   - Username: emma_dev / Password: password123');
    console.log('   - Username: jordan_learns / Password: password123');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
