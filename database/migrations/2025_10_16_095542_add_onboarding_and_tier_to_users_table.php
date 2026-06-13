<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('tier')->default('student')->after('password');
            $table->timestamp('onboarded_at')->nullable()->after('tier');
            $table->string('department')->nullable()->after('onboarded_at');
            $table->string('year_of_study')->nullable()->after('department');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['tier', 'onboarded_at', 'department', 'year_of_study']);
        });
    }
};
