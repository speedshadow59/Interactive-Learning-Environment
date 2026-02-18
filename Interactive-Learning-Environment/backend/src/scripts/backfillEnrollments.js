const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Course = require('../models/Course');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const normalizeId = (value) => value?.toString();

async function backfillEnrollments() {
  await connectDB();

  const courses = await Course.find({}, '_id enrolledStudents');
  const students = await User.find({ role: 'student' }, '_id enrolledCourses');

  const courseIds = new Set(courses.map((course) => normalizeId(course._id)));
  const studentIds = new Set(students.map((student) => normalizeId(student._id)));

  const studentCourseMap = new Map(
    students.map((student) => [
      normalizeId(student._id),
      new Set((student.enrolledCourses || []).map((courseId) => normalizeId(courseId))),
    ])
  );

  const courseStudentMap = new Map(
    courses.map((course) => [
      normalizeId(course._id),
      new Set((course.enrolledStudents || []).map((studentId) => normalizeId(studentId))),
    ])
  );

  const userUpdates = [];
  const courseUpdates = [];

  for (const course of courses) {
    const courseId = normalizeId(course._id);
    for (const studentId of courseStudentMap.get(courseId)) {
      if (!studentIds.has(studentId)) {
        continue;
      }

      const studentCourses = studentCourseMap.get(studentId) || new Set();
      if (!studentCourses.has(courseId)) {
        userUpdates.push({
          updateOne: {
            filter: { _id: studentId },
            update: { $addToSet: { enrolledCourses: courseId } },
          },
        });
      }
    }
  }

  for (const student of students) {
    const studentId = normalizeId(student._id);
    const enrolledCourseSet = studentCourseMap.get(studentId) || new Set();

    for (const courseId of enrolledCourseSet) {
      if (!courseIds.has(courseId)) {
        continue;
      }

      const courseStudents = courseStudentMap.get(courseId) || new Set();
      if (!courseStudents.has(studentId)) {
        courseUpdates.push({
          updateOne: {
            filter: { _id: courseId },
            update: { $addToSet: { enrolledStudents: studentId } },
          },
        });
      }
    }
  }

  let usersModified = 0;
  let coursesModified = 0;

  if (userUpdates.length) {
    const userResult = await User.bulkWrite(userUpdates);
    usersModified = userResult.modifiedCount || 0;
  }

  if (courseUpdates.length) {
    const courseResult = await Course.bulkWrite(courseUpdates);
    coursesModified = courseResult.modifiedCount || 0;
  }

  console.log('Enrollment backfill complete');
  console.log(`- User records updated: ${usersModified}`);
  console.log(`- Course records updated: ${coursesModified}`);
  console.log(`- User update operations queued: ${userUpdates.length}`);
  console.log(`- Course update operations queued: ${courseUpdates.length}`);

  await mongoose.connection.close();
}

backfillEnrollments()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Enrollment backfill failed:', error.message);
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
    process.exit(1);
  });