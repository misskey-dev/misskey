const gcd = (a, b) => !b ? a : gcd(b, a % b);
module.exports = gcd;
