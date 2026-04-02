import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Student from './src/models/studentSchema.js';

async function getOTP() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/acad-point');
        const student = await Student.findOne({ email: 'mhhridhik@gmail.com' });
        if (student) {
            console.log('--- OTP REPORT ---');
            console.log('Student:', student.name);
            console.log('Register No:', student.registerNumber);
            console.log('OTP:', student.resetPasswordToken);
            console.log('Expires:', student.resetPasswordExpires);
        } else {
            console.log('Student not found with that email.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}
getOTP();
