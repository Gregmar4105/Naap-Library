<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $programs = [
            [
                'code' => 'BSCS',
                'name' => 'Bachelor of Science in Computer Science',
                'department' => 'College of Computer Studies',
                'duration_years' => 4.0,
                'duration_months' => 48,
                'semester_duration_months' => 5,
                'semester_expiration_date' => Carbon::now('Asia/Manila')->addMonths(5)->endOfMonth()->format('Y-m-d'),
                'duration_display' => '4 Years (8 Semesters)',
                'description' => 'Focuses on computing theory, algorithm design, software engineering, and artificial intelligence.',
                'status' => 'Active',
            ],
            [
                'code' => 'BSIT',
                'name' => 'Bachelor of Science in Information Technology',
                'department' => 'College of Computer Studies',
                'duration_years' => 4.0,
                'duration_months' => 48,
                'semester_duration_months' => 5,
                'semester_expiration_date' => Carbon::now('Asia/Manila')->addMonths(5)->endOfMonth()->format('Y-m-d'),
                'duration_display' => '4 Years (8 Semesters)',
                'description' => 'Covers network administration, web systems, database management, and cybersecurity.',
                'status' => 'Active',
            ],
            [
                'code' => 'BSCPE',
                'name' => 'Bachelor of Science in Computer Engineering',
                'department' => 'College of Engineering',
                'duration_years' => 4.0,
                'duration_months' => 48,
                'semester_duration_months' => 5,
                'semester_expiration_date' => Carbon::now('Asia/Manila')->addMonths(5)->endOfMonth()->format('Y-m-d'),
                'duration_display' => '4 Years (8 Semesters)',
                'description' => 'Combines hardware systems, embedded engineering, robotics, and software systems.',
                'status' => 'Active',
            ],
            [
                'code' => 'BSN',
                'name' => 'Bachelor of Science in Nursing',
                'department' => 'College of Nursing & Allied Health',
                'duration_years' => 4.0,
                'duration_months' => 48,
                'semester_duration_months' => 5,
                'semester_expiration_date' => Carbon::now('Asia/Manila')->addMonths(5)->endOfMonth()->format('Y-m-d'),
                'duration_display' => '4 Years (8 Semesters + Clinical Rotations)',
                'description' => 'Comprehensive healthcare, patient care, medical ethics, and clinical practice.',
                'status' => 'Active',
            ],
            [
                'code' => 'BSBA',
                'name' => 'Bachelor of Science in Business Administration',
                'department' => 'College of Business Management',
                'duration_years' => 4.0,
                'duration_months' => 48,
                'semester_duration_months' => 5,
                'semester_expiration_date' => Carbon::now('Asia/Manila')->addMonths(5)->endOfMonth()->format('Y-m-d'),
                'duration_display' => '4 Years (8 Semesters)',
                'description' => 'Specializations in marketing, financial management, human resource management, and operations.',
                'status' => 'Active',
            ],
            [
                'code' => 'ACT',
                'name' => 'Associate in Computer Technology',
                'department' => 'College of Computer Studies',
                'duration_years' => 2.0,
                'duration_months' => 24,
                'semester_duration_months' => 5,
                'semester_expiration_date' => Carbon::now('Asia/Manila')->addMonths(5)->endOfMonth()->format('Y-m-d'),
                'duration_display' => '2 Years (4 Semesters)',
                'description' => 'Two-year diploma program focusing on application development and computer operations.',
                'status' => 'Active',
            ],
        ];

        foreach ($programs as $prog) {
            Program::updateOrCreate(['code' => $prog['code']], $prog);
        }
    }
}
