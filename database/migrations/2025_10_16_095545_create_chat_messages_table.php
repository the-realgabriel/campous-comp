<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('role'); // 'user' or 'assistant'
            $table->text('content'); // will be encrypted at model level
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
