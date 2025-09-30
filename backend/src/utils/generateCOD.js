function generateCodCode(digitCount = 6) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // 2 chữ cái đầu
    const firstTwo =
        letters[Math.floor(Math.random() * 26)] +
        letters[Math.floor(Math.random() * 26)];

    // dãy số tiếp theo
    let numbers = '';
    for (let i = 0; i < digitCount; i++) {
        numbers += Math.floor(Math.random() * 10); // 0‑9
    }

    return `${firstTwo}${numbers}`; // Ví dụ: "QZ438210"
}

module.exports = generateCodCode;