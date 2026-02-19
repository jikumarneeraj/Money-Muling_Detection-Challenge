const fs = require('fs');
const path = require('path');

function generateCSV() {
    const headers = 'transaction_id,sender_id,receiver_id,amount,timestamp\n';
    let content = headers;

    // 1. Create a Cycle (A->B->C->A)
    // RING_001
    // ACC_C1 -> ACC_C2 -> ACC_C3 -> ACC_C1
    content += `TX_C1,ACC_C1,ACC_C2,500.00,2023-01-01 10:00:00\n`;
    content += `TX_C2,ACC_C2,ACC_C3,500.00,2023-01-01 10:15:00\n`;
    content += `TX_C3,ACC_C3,ACC_C1,500.00,2023-01-01 10:30:00\n`;

    // 2. Create Smurfing Fan-in (S1..S10 -> R1)
    // ACC_R1 receives from ACC_S1...ACC_S10
    for (let i = 1; i <= 12; i++) {
        content += `TX_S${i},ACC_S${i},ACC_R1,100.00,2023-01-02 09:${String(i).padStart(2, '0')}:00\n`;
    }

    // 3. Create Layered Shell (L1 -> L2 -> L3 -> L4)
    // L2 and L3 are shells (receive 1, send 1)
    content += `TX_L1,ACC_L1,ACC_L2,1000.00,2023-01-03 12:00:00\n`;
    content += `TX_L2,ACC_L2,ACC_L3,990.00,2023-01-03 12:10:00\n`;
    content += `TX_L3,ACC_L3,ACC_L4,980.00,2023-01-03 12:20:00\n`;

    // 4. Normal traffic (Noise)
    for (let i = 0; i < 50; i++) {
        content += `TX_N${i},ACC_N${i},ACC_N${i + 1},50.00,2023-01-05 10:00:00\n`;
    }

    fs.writeFileSync('sample_transactions.csv', content);
    console.log('Generated sample_transactions.csv');
}

generateCSV();
