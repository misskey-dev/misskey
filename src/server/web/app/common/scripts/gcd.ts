const gcd = (a, b) => !b ? a : gcd(b, a % b);
export default gcd;
