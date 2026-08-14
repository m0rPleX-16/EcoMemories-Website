<?php

namespace Database\Seeders;

use App\Models\Device;
use Illuminate\Database\Seeder;

class SimulatorDeviceSeeder extends Seeder
{
    public function run(): void
    {
        Device::firstOrCreate(
            ['device_code' => 'SIMULATOR-001'],
            [
                'name' => 'Deposit Simulator',
                'type' => Device::TYPE_SIMULATOR,
                'status' => Device::STATUS_ACTIVE,
            ]
        );
    }
}
