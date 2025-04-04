import db from '../config/db.js'; // Adjust the path as necessary

class EmailUser {
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM email_user WHERE email = ?', [email]);
    return rows[0];
  }

  static async create(user) {
    const { name, email, password, verificationCode } = user;
    const [result] = await db.query(
      'INSERT INTO email_user (name, email, password, verification_code, is_verified) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, verificationCode, false]
    );
    return result.insertId;
  }

  static async verifyEmail(email, code) {
    const [result] = await db.query(
      'UPDATE email_user SET is_verified = true WHERE email = ? AND verification_code = ?',
      [email, code]
    );
    return result.affectedRows > 0;
  }

  static async updateVerificationCode(email, code) {
    await db.query(
      'UPDATE email_user SET verification_code = ? WHERE email = ?',
      [code, email]
    );
  }
}

export default EmailUser;
