<?php

namespace Database\Seeders;

use App\Models\Device;
use Illuminate\Database\Seeder;

class Esp32DeviceSeeder extends Seeder
{
    public function run(): void
    {
        Device::firstOrCreate(
            ['device_code' => 'ESP32-001'],
            [
                'name' => 'ESP32 Smart Kiosk Device',
                'type' => Device::TYPE_RECYCLING,
                'status' => Device::STATUS_ACTIVE,
            ]
        );
    }
}
